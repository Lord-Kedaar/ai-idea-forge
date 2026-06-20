import { randomId } from '../utils/ids.js';
import { AppError } from '../utils/errors.js';
import { cancelRun, executeRun, registerSSEResponse } from '../orchestration/runEngine.js';
import { deleteRun, listRuns, loadRun, saveRun, setStorageDir } from '../storage/runStorage.js';
import { loadEnv } from '../config/env.js';

const runMeta = new Map();

function configureStorage() {
  const env = loadEnv();
  setStorageDir(env.runStorageDir);
  return env;
}

export async function createForgeRun(req, res, next) {
  try {
    const { workflowType, idea, context, constraints, language } = req.body || {};
    if (!idea || typeof idea !== 'string' || !idea.trim()) return next(AppError.badRequest('idea is required'));
    if (!workflowType || typeof workflowType !== 'string') return next(AppError.badRequest('workflowType is required'));

    const env = configureStorage();
    const runId = randomId();
    const now = new Date().toISOString();
    runMeta.set(runId, { runId, workflowType, idea, language: ['en', 'de', 'pl'].includes(language) ? language : 'pl', status: 'pending', createdAt: now });

    executeRun(runId, { workflowType, idea, context, constraints, language }, env)
      .then(({ state }) => {
        runMeta.set(runId, {
          runId,
          workflowType,
          idea,
          status: state.status,
          provider: state.provider,
          requestedModel: state.requestedModel,
          actualModel: state.actualModel,
          createdAt: state.createdAt || now,
          completedAt: state.completedAt,
        });
      })
      .catch((err) => {
        console.error(`[forgeRuns] run ${runId} error:`, err.message);
        runMeta.set(runId, { runId, workflowType, idea, status: 'failed', createdAt: now, error: err.message });
      });

    return res.status(201).json({ runId, status: 'pending', createdAt: now });
  } catch (e) {
    return next(e);
  }
}

export async function listForgeRuns(req, res, next) {
  try {
    configureStorage();
    const runs = await listRuns();
    return res.json({ runs });
  } catch (e) {
    return next(e);
  }
}

export async function getForgeRun(req, res, next) {
  const { runId } = req.params;
  try {
    configureStorage();
    const data = await loadRun(runId);
    return res.json(data);
  } catch {
    const meta = runMeta.get(runId);
    if (!meta) return next(AppError.notFound(`Run ${runId} does not exist`));
    return res.json(meta);
  }
}

export async function cancelForgeRun(req, res, next) {
  const { runId } = req.params;
  try {
    configureStorage();
    const result = await cancelRun(runId, 'Stopped by user');
    if (result.ok && result.run) {
      runMeta.set(runId, { ...result.run });
      return res.json({ ok: true, run: result.run });
    }

    let existing;
    try {
      existing = await loadRun(runId);
    } catch (e) {
      if (e?.code === 'ENOENT') return next(AppError.notFound('Run ' + runId + ' does not exist'));
      throw e;
    }

    if (['completed', 'failed', 'cancelled'].includes(existing.status)) {
      return res.json({ ok: true, run: existing, alreadyFinal: true });
    }

    const cancelledAt = new Date().toISOString();
    const cancelled = {
      ...existing,
      status: 'cancelled',
      currentAgent: null,
      completedAt: cancelledAt,
      cancelledAt,
      cancelReason: 'Stopped by user',
      stages: (existing.stages || []).map((stage) => (
        ['completed', 'failed'].includes(stage.status)
          ? stage
          : { ...stage, status: 'cancelled', completedAt: cancelledAt }
      )),
    };

    await saveRun({ runId, stages: cancelled.stages, toJSON: () => cancelled });
    runMeta.set(runId, cancelled);
    return res.json({ ok: true, run: cancelled });
  } catch (e) {
    return next(e);
  }
}

export async function deleteForgeRun(req, res, next) {
  const { runId } = req.params;
  try {
    configureStorage();
    await deleteRun(runId);
    runMeta.delete(runId);
    return res.json({ ok: true, runId });
  } catch (e) {
    return next(e);
  }
}

export function getForgeRunEvents(req, res) {
  const { runId } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write(': connected\n\n');

  registerSSEResponse(runId, res);
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
  if (m === 'POST' && path === '/api/forge/runs') return createForgeRun(req, res, next);
  if (m === 'GET' && path === '/api/forge/runs') return listForgeRuns(req, res, next);
  if (m === 'POST' && path.match(/^\/api\/forge\/runs\/[^/]+\/cancel$/)) return cancelForgeRun(req, res, next);
  if (m === 'GET' && path.match(/^\/api\/forge\/runs\/[^/]+$/)) return getForgeRun(req, res, next);
  if (m === 'DELETE' && path.match(/^\/api\/forge\/runs\/[^/]+$/)) return deleteForgeRun(req, res, next);
  if (m === 'GET' && path.match(/^\/api\/forge\/runs\/[^/]+\/events$/)) return getForgeRunEvents(req, res);
  return next();
}
