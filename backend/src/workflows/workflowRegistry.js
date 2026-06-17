/**
 * AI Idea Forge — Workflow Registry
 */

import { WORKFLOW_DEFINITIONS } from './workflowDefinitions.js';

/**
 * Pobierz definicję workflow.
 */
export function getWorkflow(workflowId) {
  const def = WORKFLOW_DEFINITIONS[workflowId];
  if (!def) throw new Error(`Nieznany workflow: ${workflowId}`);
  return def;
}

/**
 * Lista workflow (bez pełnej definicji).
 */
export function listWorkflows() {
  return Object.values(WORKFLOW_DEFINITIONS).map(
    ({ id, name, description, agents, summary }) => ({
      id,
      name,
      description,
      agents,
      summary,
    })
  );
}

export { WORKFLOW_DEFINITIONS };
