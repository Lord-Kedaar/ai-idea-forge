/**
 * Unit tests for Run State (provider metadata)
 */

import { describe, it, expect } from '@jest/globals';
import { RunState } from '../../src/orchestration/runState.js';

describe('Run State — provider metadata', () => {
  it('stores provider, requestedModel on construction', () => {
    const s = new RunState({
      runId: 'r1',
      workflowType: 'decision_memo',
      idea: 'X',
      agents: ['generator', 'decider'],
      provider: 'freellmapi',
      requestedModel: 'auto',
    });
    expect(s.provider).toBe('freellmapi');
    expect(s.requestedModel).toBe('auto');
    expect(s.actualModel).toBeNull();
  });

  it('completeAgent sets actualModel on first response', () => {
    const s = new RunState({
      runId: 'r1',
      workflowType: 'decision_memo',
      idea: 'X',
      agents: ['generator', 'decider'],
      provider: 'freellmapi',
      requestedModel: 'auto',
    });
    s.completeAgent('generator', 'out', { model: 'gpt-4o-mini' });
    expect(s.actualModel).toBe('gpt-4o-mini');
    expect(s.stages[0].model).toBe('gpt-4o-mini');
  });

  it('actualModel stays as the first model even if subsequent calls differ', () => {
    const s = new RunState({
      runId: 'r1',
      workflowType: 'decision_memo',
      idea: 'X',
      agents: ['generator', 'decider'],
      provider: 'freellmapi',
      requestedModel: 'auto',
    });
    s.completeAgent('generator', 'out', { model: 'gpt-4o-mini' });
    s.completeAgent('decider', 'out2', { model: 'claude-haiku' });
    expect(s.actualModel).toBe('gpt-4o-mini');
    expect(s.stages[1].model).toBe('claude-haiku');
  });

  it('toJSON includes provider/requestedModel/actualModel', () => {
    const s = new RunState({
      runId: 'r1',
      workflowType: 'decision_memo',
      idea: 'X',
      agents: ['generator'],
      provider: 'omlx',
      requestedModel: 'llama3.2',
    });
    s.completeAgent('generator', 'out', { model: 'llama3.2' });
    const j = s.toJSON();
    expect(j.provider).toBe('omlx');
    expect(j.requestedModel).toBe('llama3.2');
    expect(j.actualModel).toBe('llama3.2');
  });
});
