/**
 * AI Idea Forge — Run Engine
 * Sequential agent pipeline orchestrator.
 */

import { RunState } from './runState.js';
import { RunEvents } from './runEvents.js';
import { getAgent, getAgentPrompts } from '../agents/agentRegistry.js';
import { getWorkflow } from '../workflows/workflowRegistry.js';
import { getActiveProvider, getActiveProviderId } from '../providers/providerRegistry.js';
import { looksDegenerate, normalizeText } from '../utils/textGuards.js';
import { createTimeoutAbortSignal } from '../utils/timeouts.js';
import { buildDecisionMemo } from '../artifacts/decisionMemoBuilder.js';
import { saveRun } from '../storage/runStorage.js';

/**
 * In-memory store for active run SSE responses (runId -> res).
 */
const activeResponses = new Map();

/**
 * Execute a single agent and return its output.
 */
async function executeAgent(agentId, state, env, events) {
  const agent = getAgent(agentId);
  const provider = getActiveProvider();

  const prompts = getAgentPrompts(agentId, {
    idea: state.idea,
    context: state.context,
    constraints: state.constraints,
    priorOutputs: state.getPriorOutputs(agentId),
  });

  const messages = [
    { role: 'system', content: prompts.systemPrompt },
    { role: 'user', content: prompts.userPrompt },
  ];

  const abortSignal = createTimeoutAbortSignal(env.turnTimeoutMs);

  try {
    const result = await provider.chatCompletion({
      messages,
      temperature: 0.7,
      maxTokens: env.maxAgentOutputTokens,
      abortSignal,
      metadata: { agentId, runId: state.runId },
    });

    let content = result.content;

    // Normalize
    content = normalizeText(content);

    // Check degeneration
    if (looksDegenerate(content)) {
      console.warn(`[RunEngine] Degenerate output from ${agentId}, using raw (flagged)`);
    }

    return { content, model: result.model, usage: result.usage };
  } finally {
    // Clear the timeout if still alive
    if (!abortSignal.aborted) {
      abortSignal._clear?.();
    }
  }
}

/**
 * Main entry point: execute a forge run.
 * @param {string} runId
 * @param {object} params — { workflowType, idea, context, constraints }
 * @param {object} env — config env
 */
export async function executeRun(runId, { workflowType, idea, context, constraints }, env) {
  const workflow = getWorkflow(workflowType);
  const agents = workflow.agents;
  const providerId = getActiveProviderId();
  const state = new RunState({
    runId,
    workflowType,
    idea,
    context,
    constraints,
    agents,
    provider: providerId,
    requestedModel: env.defaultModel || (providerId === 'freellmapi' ? env.freellmapiModel : null) || null,
  });
  const events = new RunEvents();

  // Register any SSE response waiting for this run
  const res = activeResponses.get(runId);
  if (res) {
    events.on('*', (event) => events.emitToResponse(res, event.type, event));
  }

  // Wire events to storage
  events.on('*', async () => {
    try {
      await saveRun(state);
    } catch (err) {
      console.error('[RunEngine] save error:', err.message);
    }
  });

  state.setRunning();
  events.emit('run_started', { runId, provider: providerId });

  let finalMemo = null;

  try {
    for (const agentId of agents) {
      state.startAgent(agentId);
      events.emit('agent_started', { runId, agentId });

      try {
        const { content, model, usage } = await executeAgent(agentId, state, env, events);
        state.completeAgent(agentId, content, { model });
        events.emit('agent_completed', {
          runId,
          agentId,
          output: content.slice(0, 100),
          model,
          usage,
        });
      } catch (err) {
        console.error(`[RunEngine] Agent ${agentId} error: ${err.message}`);
        state.failAgent(agentId, err.message);
        events.emit('agent_failed', { runId, agentId, error: err.message });
        // Continue with next agent per spec — pipeline continues even if one agent fails
      }
    }

    // Build decision memo (always, even if some agents failed)
    events.emit('artifact_started', { runId, artifactType: 'decision-memo' });

    try {
      finalMemo = buildDecisionMemo(state);
      await saveRun(state, { decisionMemo: finalMemo });
      events.emit('artifact_completed', { runId, artifactType: 'decision-memo' });
    } catch (err) {
      console.error('[RunEngine] Decision memo build error:', err.message);
      events.emit('artifact_failed', { runId, artifactType: 'decision-memo', error: err.message });
      try {
        finalMemo = buildDecisionMemo(state); // fallback minimal memo
        await saveRun(state, { decisionMemo: finalMemo });
      } catch (_) {
        finalMemo = null;
      }
    }

    // Mark completed BEFORE emitting (synchronously — this is the fix)
    state.setCompleted();
    // Synchronously save so the completedAt/status are persisted before SSE fires
    await saveRun(state, { decisionMemo: finalMemo });

    events.emit('run_completed', { runId, memo: finalMemo, provider: state.provider, actualModel: state.actualModel });

    // Notify SSE
    if (res) {
      events.emitToResponse(res, 'run_completed', { runId, memo: finalMemo, provider: state.provider, actualModel: state.actualModel });
  } catch (err) {
    console.error('[RunEngine] Run fatal error:', err.message);
    state.setFailed(err.message);
    // Synchronously save failed state
    await saveRun(state);
    events.emit('run_failed', { runId, error: err.message });
    if (res) {
      events.emitToResponse(res, 'run_failed', { runId, error: err.message });
    }
  }

  // Cleanup SSE response
  activeResponses.delete(runId);

  return { state, finalMemo };
}

/**
 * Register an SSE response for a run (called by SSE route).
 */
export function registerSSEResponse(runId, res) {
  activeResponses.set(runId, res);
}
