import { getAgent } from '../agentRegistry.js';

const LANGUAGE_RULES = {
  pl: 'Pisz wyłącznie po polsku, niezależnie od języka danych wejściowych.',
  en: 'Write exclusively in English, regardless of the input language.',
  de: 'Schreibe ausschließlich auf Deutsch, unabhängig von der Sprache der Eingabedaten.',
};

const OUTPUT_CONTRACT = `Return ONLY valid JSON: no markdown, no commentary before/after, no code fences.

Format:
{"summary":"one sentence, max 180 characters","findings":["3-5 short bullets, max 180 characters each"],"risks":["0-3 short risks, max 160 characters each"],"recommendation":"specific next step or decision, max 240 characters","status":"GO | REVISE | NO_GO | NEEDS_EVIDENCE"}

Quality rules:
- Use the required output language exactly.
- Do not use emoji.
- Do not use markdown tables.
- Do not use markdown headings (#, ##, ###).
- Do not write whole sentences in all caps.
- Do not create long paragraphs or manifestos.
- If data is missing, state that directly in "risks" or set "status": "NEEDS_EVIDENCE".`;

const ROLE_GUIDANCE = {
  generator: 'Develop 2-3 sensible variants and choose the most promising starting direction.',
  skeptic: 'Identify weak points, uncertainties and hidden assumptions. Keep the tone measured.',
  pragmatist: 'Turn the idea into a small feasible experiment and the shortest path to evidence.',
  redteam: 'Run a pre-mortem: what could go wrong and how to prevent it.',
  editor: 'Structure prior conclusions, remove repetition and resolve contradictions.',
  decider: 'Make a decision: GO, REVISE, NO_GO or NEEDS_EVIDENCE. Give one next step.',
};

export function getAgentPrompts(agentId, context = {}) {
  const def = getAgent(agentId);
  const idea = context.idea || '';
  const priorOutputs = context.priorOutputs || [];
  const language = ['en', 'de', 'pl'].includes(context.language) ? context.language : 'pl';
  const languageRule = LANGUAGE_RULES[language];

  const systemPrompt = [
    `You are the agent: ${def.name}.`,
    def.description,
    ROLE_GUIDANCE[agentId] || def.expectedOutput,
    idea ? `Reference topic: ${idea}` : '',
    `Output language: ${language}. ${languageRule}`,
    OUTPUT_CONTRACT,
  ].filter(Boolean).join('\n\n');

  const userPrompt = [
    `Agent: ${agentId}`,
    `Idea / problem / decision:\n${idea}`,
    context.context ? `Context:\n${context.context}` : '',
    context.constraints ? `Constraints:\n${context.constraints}` : '',
    priorOutputs.length
      ? `Prior agent outputs:\n${priorOutputs.map((o) => `- ${o.agent}: ${o.output}`).join('\n')}`
      : '',
    `Return JSON only. Output language must be ${language}.`,
  ].filter(Boolean).join('\n\n');

  return { systemPrompt, userPrompt };
}

export const generateAgentPrompt = getAgentPrompts;
