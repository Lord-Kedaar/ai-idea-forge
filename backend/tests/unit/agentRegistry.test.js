/**
 * Unit tests for Agent Registry
 */

import { describe, it, expect } from '@jest/globals';

let listAgents, getAgent, getAgentPrompts;

beforeAll(async () => {
  const m = await import('../../src/agents/agentRegistry.js');
  listAgents = m.listAgents;
  getAgent = m.getAgent;
  getAgentPrompts = m.getAgentPrompts;
});

describe('Agent Registry', () => {
  it('lists 6 agents', () => {
    const agents = listAgents();
    expect(agents.length).toBe(6);
  });

  it('has correct agent IDs', () => {
    const agents = listAgents();
    const ids = agents.map(a => a.id);
    expect(ids).toContain('generator');
    expect(ids).toContain('skeptic');
    expect(ids).toContain('pragmatist');
    expect(ids).toContain('redteam');
    expect(ids).toContain('editor');
    expect(ids).toContain('decider');
  });

  it('getAgent returns agent definition', () => {
    const agent = getAgent('generator');
    expect(agent.id).toBe('generator');
    expect(agent.name).toBe('Generator');
  });

  it('getAgent throws for unknown agent', () => {
    expect(() => getAgent('unknown')).toThrow();
  });

  it('getAgentPrompts returns system and user prompts', () => {
    const { systemPrompt, userPrompt } = getAgentPrompts('generator', {
      idea: 'Test idea',
    });
    expect(systemPrompt).toContain('Generator');
    expect(systemPrompt).toContain('Test idea');
    expect(userPrompt).toContain('generator');
  });
});
