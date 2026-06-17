/**
 * Unit tests for Workflow Registry
 */

import { describe, it, expect } from '@jest/globals';

let listWorkflows, getWorkflow;

beforeAll(async () => {
  const m = await import('../../src/workflows/workflowRegistry.js');
  listWorkflows = m.listWorkflows;
  getWorkflow = m.getWorkflow;
});

describe('Workflow Registry', () => {
  it('lists 5 workflows', () => {
    const workflows = listWorkflows();
    expect(workflows.length).toBe(5);
  });

  it('has decision_memo workflow with 6 agents', () => {
    const wf = getWorkflow('decision_memo');
    expect(wf.agents.length).toBe(6);
    expect(wf.agents).toEqual(['generator', 'skeptic', 'pragmatist', 'redteam', 'editor', 'decider']);
  });

  it('throws for unknown workflow', () => {
    expect(() => getWorkflow('unknown')).toThrow();
  });
});
