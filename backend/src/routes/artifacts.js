import { join } from 'path';
import { readFile, writeFile } from 'fs/promises';
import env from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { buildDecisionMemo } from '../artifacts/decisionMemoBuilder.js';
import { loadRun, setStorageDir } from '../storage/runStorage.js';

export async function getDecisionMemo(req, res, next) {
  const { runId } = req.params;
  const artifactPath = join(env.runStorageDir, runId, 'DECISION_MEMO.md');

  try {
    setStorageDir(env.runStorageDir);
    const run = await loadRun(runId);
    const content = buildDecisionMemo(run);
    await writeFile(artifactPath, content, 'utf-8');
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    return res.send(content);
  } catch (err) {
    if (err.code !== 'ENOENT') return next(AppError.internal(`Błąd budowania memo: ${err.message}`));
  }

  try {
    const content = await readFile(artifactPath, 'utf-8');
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    return res.send(content);
  } catch (err) {
    if (err.code === 'ENOENT') return next(AppError.notFound(`Decision memo dla run ${runId} nie istnieje (run nieukończony)`));
    return next(AppError.internal(`Błąd odczytu: ${err.message}`));
  }
}

export default function artifactsRouter(req, res, next) {
  const { method, path } = req;
  const m = method.toUpperCase();
  if (m === 'GET' && path.match(/^\/api\/forge\/runs\/[^/]+\/artifacts\/decision-memo$/)) return getDecisionMemo(req, res, next);
  return next();
}
