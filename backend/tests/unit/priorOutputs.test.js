import { jest } from '@jest/globals';
import { AGENT_DEFINITIONS } from '../../src/agents/agentDefinitions.js';
import { getAgentPrompts } from '../../src/agents/agentRegistry.js';
import { RunState } from '../../src/orchestration/runState.js';

// ---------------------------------------------------------------------------
// Bug A regression test: getPriorOutputs must return { agent, output }
// NOT { agent, content } — the prompt template reads o.output
// ---------------------------------------------------------------------------

describe('priorOutputs field name regression', () => {
  it('getPriorOutputs returns { agent, output } (not content) so the prompt template can read o.output', () => {
    const state = new RunState({
      runId: 'test-1',
      workflowType: 'full_analysis',
      idea: 'Test idea',
      context: '',
      constraints: '',
      language: 'pl',
      agents: ['generator', 'pragmatist', 'editor', 'decider'],
      provider: 'test',
      requestedModel: null,
    });

    // Simulate generator completed
    state.completeAgent('generator', 'Generator output text');
    // Simulate pragmatist completed
    state.completeAgent('pragmatist', 'Pragmatist output text');

    const priorForEditor = state.getPriorOutputs('editor');

    // Must have 2 entries
    expect(priorForEditor).toHaveLength(2);

    // Each entry must have 'output' field (not 'content')
    for (const entry of priorForEditor) {
      expect(entry).toHaveProperty('output');
      expect(entry).not.toHaveProperty('content');
    }

    // Verify actual values
    const byAgent = Object.fromEntries(priorForEditor.map((e) => [e.agent, e.output]));
    expect(byAgent.generator).toBe('Generator output text');
    expect(byAgent.pragmatist).toBe('Pragmatist output text');
  });

  it('first agent (generator) gets zero prior outputs', () => {
    const state = new RunState({
      runId: 'test-2',
      workflowType: 'full_analysis',
      idea: 'Test idea',
      context: '',
      constraints: '',
      language: 'pl',
      agents: ['generator', 'pragmatist'],
      provider: 'test',
      requestedModel: null,
    });

    const priorForGenerator = state.getPriorOutputs('generator');
    expect(priorForGenerator).toHaveLength(0);
  });

  it('prior outputs excludes current agent', () => {
    const state = new RunState({
      runId: 'test-3',
      workflowType: 'decision_memo',
      idea: 'Test idea',
      context: '',
      constraints: '',
      language: 'pl',
      agents: ['pragmatist', 'editor', 'decider'],
      provider: 'test',
      requestedModel: null,
    });

    state.completeAgent('pragmatist', 'Prag result');
    state.completeAgent('editor', 'Editor result');

    const priorForDecider = state.getPriorOutputs('decider');
    expect(priorForDecider).toHaveLength(2);
    const ids = priorForDecider.map((e) => e.agent);
    expect(ids).not.toContain('decider');
  });
});

// ---------------------------------------------------------------------------
// Integration test: prompt template renders priorOutputs correctly
// Tests the full round-trip: RunState → getPriorOutputs → prompt template
// ---------------------------------------------------------------------------

describe('prompt template with priorOutputs integration', () => {
  const IDEA = 'Testowa idea do analizy';
  const CONTEXT = 'Kontekst testowy';
  const CONSTRAINTS = 'Ograniczenia testowe';

  function buildFullPrompt(agentId, priorEntries) {
    // This mirrors getAgentPrompts exactly
    const def = AGENT_DEFINITIONS[agentId];
    const language = 'pl';
    const languageRule = 'Pisz wyłącznie po polsku, niezależnie od języka danych wejściowych.';
    const OUTPUT_CONTRACT = 'Return ONLY valid JSON: no markdown, no commentary before/after, no code fences.';

    const ROLE_GUIDANCE = {
      generator: 'Develop 2-3 sensible variants and choose the most promising starting direction.',
      editor: 'Structure prior conclusions, remove repetition and resolve contradictions.',
      decider: 'Make a decision: GO, REVISE, NO_GO or NEEDS_EVIDENCE. Give one next step.',
    };

    const systemPrompt = [
      `You are the agent: ${def.name}.`,
      def.description,
      ROLE_GUIDANCE[agentId] || def.expectedOutput,
      `Reference topic: ${IDEA}`,
      `Output language: ${language}. ${languageRule}`,
      OUTPUT_CONTRACT,
    ].filter(Boolean).join('\n\n');

    const userPrompt = [
      `Agent: ${agentId}`,
      `Idea / problem / decision:\n${IDEA}`,
      `Context:\n${CONTEXT}`,
      `Constraints:\n${CONSTRAINTS}`,
      priorEntries.length
        ? `Prior agent outputs:\n${priorEntries.map((o) => `- ${o.agent}: ${o.output}`).join('\n')}`
        : '',
      `Return JSON only. Output language must be ${language}.`,
    ].filter(Boolean).join('\n\n');

    return { systemPrompt, userPrompt };
  }

  it('decider gets generator and editor outputs in user prompt', () => {
    const priorEntries = [
      { agent: 'generator', output: 'Generators full output here' },
      { agent: 'editor', output: 'Editors condensed output here' },
    ];

    const { userPrompt } = buildFullPrompt('decider', priorEntries);

    expect(userPrompt).toContain('Generators full output here');
    expect(userPrompt).toContain('Editors condensed output here');
  });

  it('generator gets zero prior outputs (no Prior agent outputs section)', () => {
    const { userPrompt } = buildFullPrompt('generator', []);
    expect(userPrompt).not.toContain('Prior agent outputs');
    expect(userPrompt).toContain('Testowa idea do analizy');
  });

  it('prior outputs appear in correct position in user prompt', () => {
    const priorEntries = [{ agent: 'generator', output: 'Gen out' }];
    const { userPrompt } = buildFullPrompt('editor', priorEntries);

    // Prior outputs must come after Context and Constraints
    const priorIdx = userPrompt.indexOf('Prior agent outputs');
    const constraintsIdx = userPrompt.indexOf('Constraints:');
    const ideaIdx = userPrompt.indexOf('Idea / problem / decision:');

    expect(ideaIdx).toBeGreaterThan(-1);
    expect(constraintsIdx).toBeGreaterThan(-1);
    expect(priorIdx).toBeGreaterThan(constraintsIdx);
  });
});

// ---------------------------------------------------------------------------
// Regression: first agent should NOT get Reference topic duplicated with
// Idea / problem / decision — both appear but carry different roles
// ---------------------------------------------------------------------------

describe('idea duplication for first vs subsequent agents', () => {
  it('generator gets idea once in Reference topic AND once in Idea/problem/decision (2x is intentional)', () => {
    const { systemPrompt, userPrompt } = getAgentPrompts('generator', {
      idea: 'Moja idea',
      context: '',
      constraints: '',
      priorOutputs: [],
      language: 'pl',
    });

    // Reference topic appears in system prompt
    expect(systemPrompt).toContain('Reference topic: Moja idea');
    // Idea / problem / decision appears in user prompt
    expect(userPrompt).toContain('Idea / problem / decision:\nMoja idea');
    // No prior outputs section for first agent
    expect(userPrompt).not.toContain('Prior agent outputs');
  });

  it('subsequent agent gets idea (Reference topic + Idea/problem/decision) plus prior outputs', () => {
    const { systemPrompt, userPrompt } = getAgentPrompts('editor', {
      idea: 'Moja idea',
      context: '',
      constraints: '',
      priorOutputs: [
        { agent: 'generator', output: 'Generator result' },
      ],
      language: 'pl',
    });

    expect(systemPrompt).toContain('Reference topic: Moja idea');
    expect(userPrompt).toContain('Idea / problem / decision:\nMoja idea');
    expect(userPrompt).toContain('Prior agent outputs:');
    expect(userPrompt).toContain('Generator result');
  });
});
