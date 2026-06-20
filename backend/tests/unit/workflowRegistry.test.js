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
  it('lists 6 workflows (including full_analysis)', () => {
    const workflows = listWorkflows();
    expect(workflows.length).toBe(6);
    const ids = workflows.map((w) => w.id);
    expect(ids).toEqual(['develop_idea', 'critique_idea', 'premortem', 'compare_variants', 'decision_memo', 'full_analysis']);
  });

  it('has decision_memo (Quick Recommendation) workflow with short pipeline', () => {
    // decision_memo (UI: Szybka rekomendacja / Quick Recommendation / Empfehlung erstellen)
    // is intentionally the shortest, most decisive mode.
    const wf = getWorkflow('decision_memo');
    expect(wf.id).toBe('decision_memo');
    expect(wf.name).toBe('Szybka rekomendacja');
    expect(wf.agents).toEqual(['pragmatist', 'editor', 'decider']);
  });

  it('develop_idea pipeline: generator -> editor -> decider', () => {
    expect(getWorkflow('develop_idea').agents).toEqual(['generator', 'editor', 'decider']);
  });

  it('critique_idea pipeline: skeptic -> pragmatist -> editor -> decider', () => {
    expect(getWorkflow('critique_idea').agents).toEqual(['skeptic', 'pragmatist', 'editor', 'decider']);
  });

  it('premortem pipeline: redteam -> skeptic -> pragmatist -> editor -> decider', () => {
    expect(getWorkflow('premortem').agents).toEqual(['redteam', 'skeptic', 'pragmatist', 'editor', 'decider']);
  });

  it('compare_variants pipeline: generator -> pragmatist -> skeptic -> editor -> decider', () => {
    expect(getWorkflow('compare_variants').agents).toEqual(['generator', 'pragmatist', 'skeptic', 'editor', 'decider']);
  });

  it('full_analysis pipeline: generator -> skeptic -> pragmatist -> redteam -> editor -> decider', () => {
    const wf = getWorkflow('full_analysis');
    expect(wf.id).toBe('full_analysis');
    expect(wf.name).toBe('Pełna analiza');
    expect(wf.agents).toEqual(['generator', 'skeptic', 'pragmatist', 'redteam', 'editor', 'decider']);
  });

  it('throws for unknown workflow', () => {
    expect(() => getWorkflow('unknown')).toThrow();
  });
});
