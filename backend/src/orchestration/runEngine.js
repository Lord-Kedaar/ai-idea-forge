import { RunState } from './runState.js';
import { RunEvents } from './runEvents.js';
import { getAgentPrompts } from '../agents/agentRegistry.js';
import { getWorkflow } from '../workflows/workflowRegistry.js';
import { getActiveProvider, getActiveProviderId } from '../providers/providerRegistry.js';
import { looksDegenerate, normalizeText } from '../utils/textGuards.js';
import { buildDecisionMemo } from '../artifacts/decisionMemoBuilder.js';
import { saveRun } from '../storage/runStorage.js';

const activeResponses = new Map();
const activeRuns = new Map();

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

async function executeAgent(agentId, state, env, cancelSignal) {
  const provider = getActiveProvider();
  const prompts = getAgentPrompts(agentId, {
    idea: state.idea,
    context: state.context,
    constraints: state.constraints,
    priorOutputs: state.getPriorOutputs(agentId), language: state.language,
  });

  const abortSignal = createCombinedAbortSignal(env.turnTimeoutMs, cancelSignal);
  try {
    const result = await provider.chatCompletion({
      messages: [
        { role: 'system', content: prompts.systemPrompt },
        { role: 'user', content: prompts.userPrompt },
      ],
      temperature: 0.7,
      maxTokens: env.maxAgentOutputTokens,
      abortSignal,
      metadata: { agentId, runId: state.runId },
    });

    const content = normalizeText(result.content);
    if (looksDegenerate(content)) {
      console.warn(`[RunEngine] Degenerate output from ${agentId}, using raw content`);
    }

    return { content, model: result.model, usage: result.usage };
  } finally {
    abortSignal._clear?.();
  }
}

export async function executeRun(runId, { workflowType, idea, context, constraints, language }, env) {
  const workflow = getWorkflow(workflowType);
  const providerId = getActiveProviderId();
  const cancelController = new AbortController();
  const state = new RunState({
    runId,
    workflowType,
    idea,
    context,
    constraints, language,
    agents: workflow.agents,
    provider: providerId,
    requestedModel: env.defaultModel || (providerId === 'freellmapi' ? env.freellmapiModel : null) || null,
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
    emit(runId, events, 'run_started', { provider: providerId });

    for (const agentId of workflow.agents) {
      if (cancelController.signal.aborted) throw new Error('Run cancelled');

      state.startAgent(agentId);
      await saveRun(state);
      emit(runId, events, 'agent_started', { agent: agentId });

      try {
        const result = await executeAgent(agentId, state, env, cancelController.signal);
        if (cancelController.signal.aborted) throw new Error('Run cancelled');
        state.completeAgent(agentId, result.content, { model: result.model });
        await saveRun(state);
        emit(runId, events, 'agent_completed', { agent: agentId, output: result.content, model: result.model, usage: result.usage });
      } catch (err) {
        if (cancelController.signal.aborted) throw new Error('Run cancelled');
        state.failAgent(agentId, err.message);
        await saveRun(state);
        emit(runId, events, 'agent_failed', { agent: agentId, error: err.message });
        throw err;
      }
    }

    const finalMemo = buildDecisionMemo(state);
    state.setCompleted();
    await saveRun(state, { decisionMemo: finalMemo });
    emit(runId, events, 'run_completed', { memo: finalMemo, provider: state.provider, actualModel: state.actualModel });
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
