/**
 * AI Idea Forge — Forge Runs routes
 * POST   /api/forge/runs                 — tworzy i uruchamia run
 * GET    /api/forge/runs                 — list runs
 * GET    /api/forge/runs/:runId          — status run
 * GET    /api/forge/runs/:runId/events   — SSE stream
 * DELETE /api/forge/runs/:runId          — delete run
 */

import { randomId } from '../utils/ids.js';
import { AppError } from '../utils/errors.js';
import { executeRun, registerSSEResponse } from '../orchestration/runEngine.js';
import { setStorageDir, loadRun, listRuns, deleteRun } from '../storage/runStorage.js';
import { loadEnv } from '../config/env.js';

// In-memory run status store (lightweight — full state in filesystem)
const runMeta = new Map();

/**
 * POST /api/forge/runs
 */
export async function createForgeRun(req, res, next) {
  const { workflowType, idea, context, constraints } = req.body || {};

  if (!idea || typeof idea !== 'string' || !idea.trim()) {
    return next(AppError.badRequest('idea jest wymagane'));
  }
  if (!workflowType || typeof workflowType !== 'string') {
    return next(AppError.badRequest('workflowType jest wymagane'));
  }

  const runId = randomId();
  const now = new Date().toISOString();

  // Configure storage dir from env
  const env = loadEnv();
  setStorageDir(env.runStorageDir);

  // Store lightweight meta (full state is in filesystem via runEngine)
  runMeta.set(runId, { runId, status: 'pending', createdAt: now });

  // Start the run asynchronously (don't await here — SSE will handle completion)
  executeRun(runId, { workflowType, idea, context, constraints }, env)
    .then(({ state }) => {
      runMeta.set(runId, { runId, status: state.status, createdAt: now });
    })
    .catch(err => {
      console.error(`[forgeRuns] run ${runId} error:`, err.message);
      runMeta.set(runId, { runId, status: 'failed', createdAt: now });
    });

  res.status(201).json({ runId, status: 'pending', createdAt: now });
}

/**
 * GET /api/forge/runs — list all runs
 */
export async function listForgeRuns(req, res, next) {
  try {
    const env = loadEnv();
    setStorageDir(env.runStorageDir);
    const runs = await listRuns();
    res.json({ runs });
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/forge/runs/:runId
 */
export async function getForgeRun(req, res, next) {
  const { runId } = req.params;

  // Try filesystem first (real state)
  try {
    const data = await loadRun(runId);
    return res.json(data);
  } catch {
    // Fall back to in-memory meta
    const meta = runMeta.get(runId);
    if (!meta) {
      return next(AppError.notFound(`Run ${runId} nie istnieje`));
    }
    return res.json(meta);
  }
}

/**
 * DELETE /api/forge/runs/:runId
 */
export async function deleteForgeRun(req, res, next) {
  const { runId } = req.params;
  try {
    const env = loadEnv();
    setStorageDir(env.runStorageDir);
    await deleteRun(runId);
    runMeta.delete(runId);
    res.json({ ok: true, runId });
  } catch (e) {
    next(e);
  }
}

/**
 * GET /api/forge/runs/:runId/events — SSE stream
 */
export function getForgeRunEvents(req, res) {
  const { runId } = req.params;

  const meta = runMeta.get(runId);
  if (!meta) {
    res.status(404).json({ error: `Run ${runId} nie istnieje` });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial ping
  res.write(': ping\n\n');

  // Register with run engine for live events
  registerSSEResponse(runId, res);

  // Heartbeat every 15s to keep connection alive
  const heartbeat = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(heartbeat);
      return;
    }
    res.write(': heartbeat\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    registerSSEResponse(runId, null);
  });
}

export default function forgeRunsRouter(req, res, next) {
  const { method, path } = req;
  const m = method.toUpperCase();

  if (m === 'POST' && path === '/api/forge/runs') {
    return createForgeRun(req, res, next);
  }
  if (m === 'GET' && path === '/api/forge/runs') {
    return listForgeRuns(req, res, next);
  }
  if (m === 'GET' && path.match(/^\/api\/forge\/runs\/[^/]+$/)) {
    return getForgeRun(req, res, next);
  }
  if (m === 'DELETE' && path.match(/^\/api\/forge\/runs\/[^/]+$/)) {
    return deleteForgeRun(req, res, next);
  }
  if (m === 'GET' && path.match(/^\/api\/forge\/runs\/[^/]+\/events$/)) {
    return getForgeRunEvents(req, res);
  }
  next();
}
