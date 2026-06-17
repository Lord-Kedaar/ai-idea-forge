/**
 * AI Idea Forge — Agent Registry
 * Rejestr agentów — każdy agent ma definicję i prompty.
 */

import { AGENT_DEFINITIONS } from './agentDefinitions.js';
import { generateAgentPrompt } from './prompts/index.js';

/**
 * Pobierz definicję agenta.
 */
export function getAgent(agentId) {
  const def = AGENT_DEFINITIONS[agentId];
  if (!def) throw new Error(`Nieznany agent: ${agentId}`);
  return def;
}

/**
 * Lista wszystkich agentów (bez promptów).
 */
export function listAgents() {
  return Object.values(AGENT_DEFINITIONS).map(({ id, name, description }) => ({
    id,
    name,
    description,
  }));
}

/**
 * Pobierz prompty dla agenta w danym kontekście.
 */
export function getAgentPrompts(agentId, context) {
  return generateAgentPrompt(agentId, context);
}

export { AGENT_DEFINITIONS };
