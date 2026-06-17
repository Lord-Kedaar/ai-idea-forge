/**
 * AI Idea Forge — Artifacts route
 * GET /api/forge/runs/:runId/artifacts/decision-memo
 */

import { join } from 'path';
import { readFile } from 'fs/promises';
import env from '../config/env.js';
import { AppError } from '../utils/errors.js';

/**
 * GET /api/forge/runs/:runId/artifacts/decision-memo
 */
export async function getDecisionMemo(req, res, next) {
  const { runId } = req.params;

  const artifactPath = join(env.runStorageDir, runId, 'DECISION_MEMO.md');

  let content;
  try {
    content = await readFile(artifactPath, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      return next(AppError.notFound(`Decision memo dla run ${runId} nie istnieje (run nieukończony)`));
    }
    return next(AppError.internal(`Błąd odczytu: ${err.message}`));
  }

  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.send(content);
}

export default function artifactsRouter(req, res, next) {
  const { method, path } = req;
  const m = method.toUpperCase();

  if (m === 'GET' && path.match(/^\/api\/forge\/runs\/[^/]+\/artifacts\/decision-memo$/)) {
    return getDecisionMemo(req, res, next);
  }
  next();
}
