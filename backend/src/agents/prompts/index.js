/**
 * AI Idea Forge — Prompts factory
 * Jeden export: generateAgentPrompt(agentId, context)
 */

import { AGENT_DEFINITIONS } from '../agentDefinitions.js';

/**
 * Generuje pełny prompt (system + user) dla agenta.
 * @param {string} agentId
 * @param {{ idea: string, context?: string, constraints?: string, priorOutputs?: Array<{agent: string, content: string}> }} context
 */
export function generateAgentPrompt(agentId, context = {}) {
  const def = AGENT_DEFINITIONS[agentId];
  if (!def) throw new Error(`Nieznany agent: ${agentId}`);

  const idea = context.idea || '';
  const priorOutputs = context.priorOutputs || [];

  const systemPrompt = buildSystemPrompt(def, context);
  const userPrompt = buildUserPrompt(agentId, idea, priorOutputs);

  return { systemPrompt, userPrompt };
}

function buildSystemPrompt(def, context) {
  let prompt = `Jesteś ${def.name}. ${def.description}

Twoje zadanie: ${def.expectedOutput}

Ograniczenia: ${def.constraints.join('; ')}.`;

  if (context.idea) {
    prompt += `\n\n## Temat / Problem / Decyzja\n${context.idea}`;
  }
  if (context.context) {
    prompt += `\n\n## Kontekst\n${context.context}`;
  }
  if (context.constraints) {
    prompt += `\n\n## Ograniczenia\n${context.constraints}`;
  }

  return prompt;
}

function buildUserPrompt(agentId, idea, priorOutputs) {
  let prompt = `Przeanalizuj temat i wykonaj zadanie agenta ${agentId}.\n\n## Temat\n${idea || 'Brak tematu.'}`;

  if (priorOutputs.length > 0) {
    prompt += '\n\n## Poprzednie etapy\n' +
      priorOutputs.map((o, i) => `### [${i + 1}] ${o.agent}\n${o.content.slice(0, 500)}`).join('\n\n');
  }

  return prompt;
}
