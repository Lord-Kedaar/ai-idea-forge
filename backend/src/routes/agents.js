/**
 * AI Idea Forge — Agents route
 * GET /api/agents
 */

import { listAgents } from '../agents/agentRegistry.js';

export default function agentsRouter(req, res) {
  res.json({ agents: listAgents() });
}
