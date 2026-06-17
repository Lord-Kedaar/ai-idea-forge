/**
 * Unit tests for Decision Memo Builder
 */

import { describe, it, expect } from '@jest/globals';
import { buildDecisionMemo } from '../../src/artifacts/decisionMemoBuilder.js';
import { RunState } from '../../src/orchestration/runState.js';

describe('Decision Memo Builder', () => {
  it('builds memo from run state', () => {
    const state = new RunState({
      runId: 'test123',
      workflowType: 'decision_memo',
      idea: 'Test idea',
      context: 'Test context',
      constraints: 'Test constraints',
      agents: ['generator', 'skeptic', 'pragmatist', 'redteam', 'editor', 'decider'],
    });
    state.setRunning();
    state.completeAgent('generator', 'Generated output');
    state.completeAgent('skeptic', 'Skeptic output');
    state.completeAgent('pragmatist', 'Pragmatist output');
    state.completeAgent('redteam', 'Redteam output');
    state.completeAgent('editor', 'Editor output');
    state.completeAgent('decider', 'Decider output');
    state.setCompleted();

    const memo = buildDecisionMemo(state);

    expect(memo).toContain('# DECISION MEMO');
    expect(memo).toContain('Test idea');
    expect(memo).toContain('Test context');
    expect(memo).toContain('Generated output');
  });

  it('handles missing agent outputs gracefully', () => {
    const state = new RunState({
      runId: 'test456',
      workflowType: 'decision_memo',
      idea: 'Minimal test',
      agents: ['generator', 'decider'],
    });
    state.setRunning();
    state.completeAgent('generator', 'Gen output');
    state.setCompleted();

    const memo = buildDecisionMemo(state);
    expect(memo).toContain('# DECISION MEMO');
  });
});
