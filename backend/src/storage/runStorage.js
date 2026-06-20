/**
 * AI Idea Forge — Run Storage
 * Filesystem-based persistence for runs.
 */

import { mkdir, writeFile, readFile, readdir, rm } from 'fs/promises';
import { join } from 'path';

let baseDir = './data/runs';

export function setStorageDir(dir) {
  baseDir = dir;
}

export function getStorageDir() {
  return baseDir;
}

/**
 * Save run state to filesystem.
 * @param {RunState} state
 * @param {{ decisionMemo?: string }} extras
 */
export async function saveRun(state, extras = {}) {
  const runDir = join(baseDir, state.runId);
  await mkdir(runDir, { recursive: true });

  const runData = {
    ...state.toJSON(),
    ...extras,
  };

  await writeFile(
    join(runDir, 'run.json'),
    JSON.stringify(runData, null, 2),
    'utf-8'
  );

  // Save agent outputs separately for easy access
  const agentOutputs = (runData.stages || [])
    .filter((s) => s.output)
    .map((s) => ({ agent: s.agent, output: s.output }));

  await writeFile(
    join(runDir, 'agent-outputs.json'),
    JSON.stringify(agentOutputs, null, 2),
    'utf-8'
  );

  if (extras.decisionMemo) {
    await writeFile(
      join(runDir, 'DECISION_MEMO.md'),
      extras.decisionMemo,
      'utf-8'
    );
  }
}

/**
 * Load run state from filesystem.
 */
export async function loadRun(runId) {
  const runPath = join(baseDir, runId, 'run.json');
  const content = await readFile(runPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * List all runs (lightweight summary).
 * Returns array of: { runId, workflowType, idea, status, createdAt, completedAt, ... }
 * Sorted by createdAt desc.
 */
export async function listRuns() {
  let entries;
  try {
    entries = await readdir(baseDir, { withFileTypes: true });
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }

  const runs = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const runId = entry.name;
    try {
      const data = await loadRun(runId);
      runs.push({
        runId: data.runId,
        workflowType: data.workflowType,
        idea: data.idea,
        context: data.context,
        constraints: data.constraints,
        status: data.status,
        createdAt: data.createdAt,
        completedAt: data.completedAt,
        stages: (data.stages || []).map(s => ({ agent: s.agent, status: s.status })),
      });
    } catch {
      // skip corrupt / incomplete runs
    }
  }
  runs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return runs;
}

/**
 * Delete a run directory.
 */
export async function deleteRun(runId) {
  const runDir = join(baseDir, runId);
  await rm(runDir, { recursive: true, force: true });
}
