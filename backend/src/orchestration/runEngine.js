import { RunState } from './runState.js';
import { RunEvents } from './runEvents.js';
import { getAgentPrompts } from '../agents/agentRegistry.js';
import { getWorkflow } from '../workflows/workflowRegistry.js';
import { AGENT_DEFINITIONS } from '../agents/agentDefinitions.js';
import { FakeProvider } from '../providers/fakeProvider.js';
import { OmlxProvider } from '../providers/omlxProvider.js';
import { FreeLLMApiProvider } from '../providers/freeLLMApiProvider.js';
import { GroqProvider } from '../providers/groqProvider.js';
import { MistralProvider } from '../providers/mistralProvider.js';
import { looksDegenerate, normalizeText } from '../utils/textGuards.js';
import { buildDecisionMemo } from '../artifacts/decisionMemoBuilder.js';
import { saveRun } from '../storage/runStorage.js';

const activeResponses = new Map();
const activeRuns = new Map();

// ── Per-agent provider factory ──────────────────────────────────────────────

const FALLBACK_CHAIN = ['groq', 'mistral', 'omlx', 'freellmapi'];

function buildProviderConfig(providerId, env) {
  switch (providerId) {
    case 'groq':
      return { apiKey: env.groqApiKey };
    case 'mistral':
      return { apiKey: env.mistralApiKey };
    case 'omlx':
      return {
        baseUrl: env.omlxBaseUrl || 'http://localhost:8585',
        apiKey: env.omlxApiKey || '',
        model: env.omlxModel || 'gemma-4-26B-A4B-it-QAT-MLX-4bit',
      };
    case 'freellmapi':
      return {
        baseUrl: env.freellmapiBaseUrl || 'https://api.freellmapi.com',
        apiKey: env.freellmapiApiKey || '',
        model: env.freellmapiModel || 'auto',
      };
    case 'fake':
    default:
      return {};
  }
}

const _providerCache = new Map();

function getProviderForAgent(agentId, env) {
  const def = AGENT_DEFINITIONS[agentId];
  if (!def) throw new Error(`Unknown agent: ${agentId}`);
  const { provider: providerId, model } = def;

  const cacheKey = `${providerId}:${model}`;
  if (_providerCache.has(cacheKey)) return _providerCache.get(cacheKey);

  const config = buildProviderConfig(providerId, env);
  let provider;
  switch (providerId) {
    case 'groq':
      provider = new GroqProvider(config);
      break;
    case 'mistral':
      provider = new MistralProvider(config);
      break;
    case 'omlx':
      provider = new OmlxProvider(config);
      break;
    case 'freellmapi':
      provider = new FreeLLMApiProvider(config);
      break;
    case 'fake':
      provider = new FakeProvider(config);
      break;
    default:
      throw new Error(`Unknown provider: ${providerId}`);
  }
  _providerCache.set(cacheKey, provider);
  return provider;
}

function getModelForAgent(agentId) {
  const def = AGENT_DEFINITIONS[agentId];
  if (!def) return null;
  return def.model || null;
}

function getReasoningEffortForAgent(agentId) {
  const def = AGENT_DEFINITIONS[agentId];
  if (!def) return undefined;
  return def.reasoningEffort || undefined;
}

// ── Signal helpers ───────────────────────────────────────────────────────────

function createCombinedAbortSignal(timeoutMs, cancelSignal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('Agent timeout')), timeoutMs);

  const abort = () => controller.abort(cancelSignal.reason || new Error('Run cancelled'));
  if (cancelSignal.aborted) abort();
  else cancelSignal.addEventListener('abort', abort, { once: true });

  controller.signal._clear = () => {
    clearTimeout(timer);
    cancelSignal.removeEventListener('abort', abort);
  };

  return controller.signal;
}

function emit(runId, events, type, payload) {
  const event = { type, runId, at: new Date().toISOString(), ...payload };
  events.emit(type, event);
  const res = activeResponses.get(runId);
  if (res) events.emitToResponse(res, type, event);
}

// ── Per-agent execution with fallback ──────────────────────────────────────

async function executeAgentWithFallback(agentId, state, env, cancelSignal) {
  const def = AGENT_DEFINITIONS[agentId];
  const primaryProviderId = def.provider;
  const model = getModelForAgent(agentId);
  const reasoningEffort = getReasoningEffortForAgent(agentId);

  const prompts = getAgentPrompts(agentId, {
    idea: state.idea,
    context: state.context,
    constraints: state.constraints,
    priorOutputs: state.getPriorOutputs(agentId),
    language: state.language,
  });

  const abortSignal = createCombinedAbortSignal(env.turnTimeoutMs, cancelSignal);

  // Determine fallback chain: primary first, then remaining from FALLBACK_CHAIN
  const chain = [primaryProviderId, ...FALLBACK_CHAIN.filter(p => p !== primaryProviderId)];

  let lastError;
  for (const providerId of chain) {
    if (cancelSignal.aborted) throw new Error('Run cancelled');

    // Skip providers without a configured API key (safety guard)
    const config = buildProviderConfig(providerId, env);
    if (providerId === 'groq' && !config.apiKey) continue;
    if (providerId === 'mistral' && !config.apiKey) continue;

    try {
      const provider = getProviderForAgent(agentId, env);
      const agentModel = providerId === primaryProviderId ? model : null;

      const callParams = {
        messages: [
          { role: 'system', content: prompts.systemPrompt },
          { role: 'user', content: prompts.userPrompt },
        ],
        temperature: 0.7,
        maxTokens: env.maxAgentOutputTokens,
        abortSignal,
        metadata: { agentId, runId: state.runId, provider: providerId },
      };

      // Only pass model + reasoningEffort for Groq/Mistral (primary)
      if (agentModel && (providerId === 'groq' || providerId === 'mistral')) {
        callParams.model = agentModel;
        callParams.reasoningEffort = reasoningEffort;
      }

      const result = await provider.chatCompletion(callParams);
      const content = normalizeText(result.content);

      if (looksDegenerate(content)) {
        console.warn(`[RunEngine] Degenerate output from ${agentId} via ${providerId}, using raw`);
      }

      return {
        content,
        model: result.model,
        provider: providerId,
        usage: result.usage,
      };
    } catch (err) {
      if (err.message === 'Aborted') throw err;
      console.warn(`[RunEngine] ${agentId} via ${providerId} failed: ${err.message}`);
      lastError = err;
      // Try next provider in chain
    }
  }

  throw lastError || new Error(`All providers exhausted for ${agentId}`);
}

// ── Run orchestration ────────────────────────────────────────────────────────

export async function executeRun(runId, { workflowType, idea, context, constraints, language }, env) {
  const workflow = getWorkflow(workflowType);
  const cancelController = new AbortController();

  const state = new RunState({
    runId,
    workflowType,
    idea,
    context,
    constraints,
    language,
    agents: workflow.agents,
    provider: 'multi-provider',
    requestedModel: null,
  });
  const events = new RunEvents();

  activeRuns.set(runId, { controller: cancelController, state, events });

  events.on('*', async () => {
    try {
      await saveRun(state);
    } catch (err) {
      console.error('[RunEngine] save error:', err.message);
    }
  });

  try {
    state.setRunning();
    await saveRun(state);
    emit(runId, events, 'run_started', { provider: 'multi-provider' });

    for (const agentId of workflow.agents) {
      if (cancelController.signal.aborted) throw new Error('Run cancelled');

      const def = AGENT_DEFINITIONS[agentId];
      state.startAgent(agentId);
      await saveRun(state);
      emit(runId, events, 'agent_started', {
        agent: agentId,
        provider: def.provider,
        model: def.model,
        reasoningEffort: def.reasoningEffort || null,
      });

      try {
        const result = await executeAgentWithFallback(agentId, state, env, cancelController.signal);
        if (cancelController.signal.aborted) throw new Error('Run cancelled');
        state.completeAgent(agentId, result.content, { model: result.model, provider: result.provider });
        await saveRun(state);
        emit(runId, events, 'agent_completed', {
          agent: agentId,
          output: result.content,
          model: result.model,
          provider: result.provider,
          usage: result.usage,
        });
      } catch (err) {
        if (cancelController.signal.aborted || err.message === 'Run cancelled') throw err;
        state.failAgent(agentId, err.message);
        await saveRun(state);
        emit(runId, events, 'agent_failed', { agent: agentId, error: err.message });
        throw err;
      }
    }

    const finalMemo = buildDecisionMemo(state);
    state.setCompleted();
    await saveRun(state, { decisionMemo: finalMemo });
    emit(runId, events, 'run_completed', { memo: finalMemo });
    return { state, finalMemo };
  } catch (err) {
    if (cancelController.signal.aborted || err.message === 'Run cancelled') {
      state.cancel('Stopped by user');
      await saveRun(state);
      emit(runId, events, 'run_cancelled', { reason: state.cancelReason });
      return { state, finalMemo: null };
    }

    console.error('[RunEngine] Run fatal error:', err.message);
    state.setFailed(err.message);
    await saveRun(state);
    emit(runId, events, 'run_failed', { error: err.message });
    return { state, finalMemo: null };
  } finally {
    activeRuns.delete(runId);
    activeResponses.delete(runId);
  }
}

export async function cancelRun(runId, reason = 'Stopped by user') {
  const active = activeRuns.get(runId);
  if (!active) return { ok: false, active: false };

  active.controller.abort(new Error(reason));
  active.state.cancel(reason);
  await saveRun(active.state);
  emit(runId, active.events, 'run_cancelled', { reason });
  activeRuns.delete(runId);
  activeResponses.delete(runId);
  return { ok: true, active: true, run: active.state.toJSON() };
}

export function registerSSEResponse(runId, res) {
  if (!res) activeResponses.delete(runId);
  else activeResponses.set(runId, res);
}
