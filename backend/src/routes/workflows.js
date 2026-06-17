/**
 * AI Idea Forge — Workflows route
 * GET /api/workflows
 */

import { listWorkflows } from '../workflows/workflowRegistry.js';

export default function workflowsRouter(req, res) {
  res.json({ workflows: listWorkflows() });
}
