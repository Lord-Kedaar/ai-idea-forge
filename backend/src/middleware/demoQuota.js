/**
 * AI Idea Forge — Demo Quota Middleware
 *
 * Public demo policy:
 * - hard limit of N analyses per IP address
 * - persistent filesystem-backed state
 * - no automatic reset
 * - unlock only by manual action after email request
 *
 * Canonical config lives in backend/src/config/defaults.js → config.demoQuota
 */

import { createHash } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { loadEnv } from '../config/env.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR_FALLBACK = join(__dirname, '..', '..', 'data', 'demo_quota');

let _cfg = null;
function cfg() {
  if (!_cfg) _cfg = loadEnv();
  return _cfg;
}

export function demoQuotaMode() {
  return cfg().demoQuotaMode || 'limited';
}

export function demoQuotaConfig() {
  const env = cfg();
  return {
    mode: demoQuotaMode(),
    maxAnalyses: Number(env.demoQuotaMaxAnalyses || 6),
    contactEmail: env.demoQuotaContactEmail || 'kontakt@radoslaw-pleskot.com',
    cookieName: env.demoQuotaCookieName || 'forge_demo_acknowledged',
    storageDir: env.demoQuotaStorageDir || DATA_DIR_FALLBACK,
  };
}

/**
 * Stable client identifier for public demo quota state.
 * Hashing keeps the raw IP out of storage files.
 */
export function getClientIpHash(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  const realIp = req.headers?.['x-real-ip'];
  const remoteAddr = req.socket?.remoteAddress || 'unknown';

  const ip =
    (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '') ||
    (typeof realIp === 'string' ? realIp.trim() : '') ||
    remoteAddr;

  return createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

function statePath(storageDir, ipHash) {
  return join(storageDir, `${ipHash}.json`);
}

async function ensureDataDir(storageDir) {
  await mkdir(storageDir, { recursive: true });
}

async function readState(storageDir, ipHash, maxAnalyses) {
  try {
    const raw = await readFile(statePath(storageDir, ipHash), 'utf8');
    const parsed = JSON.parse(raw);
    return {
      used: Number(parsed.used) || 0,
      banned: Boolean(parsed.banned),
      bannedAt: parsed.bannedAt || null,
      updatedAt: parsed.updatedAt || null,
      limit: Number(parsed.limit) || maxAnalyses,
    };
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return {
        used: 0,
        banned: false,
        bannedAt: null,
        updatedAt: null,
        limit: maxAnalyses,
      };
    }
    throw error;
  }
}

async function writeState(storageDir, ipHash, state) {
  await ensureDataDir(storageDir);
  await writeFile(
    statePath(storageDir, ipHash),
    JSON.stringify(
      {
        ...state,
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  );
}

function buildQuotaPayload({ mode, maxAnalyses, contactEmail, used, banned }) {
  const remaining = mode === 'unlimited' ? Infinity : Math.max(0, maxAnalyses - used);
  return {
    mode,
    limit: mode === 'unlimited' ? Infinity : maxAnalyses,
    used,
    remaining,
    exceeded: banned || (mode !== 'unlimited' && used >= maxAnalyses),
    banned,
    contactEmail,
  };
}

export function demoQuotaMiddleware(req, res, next) {
  void (async () => {
    if (req.method !== 'POST' || !String(req.path || req.originalUrl || '').includes('/forge/runs')) {
      return next();
    }

    const { mode, maxAnalyses, contactEmail, storageDir } = demoQuotaConfig();
    if (mode === 'unlimited') {
      req.demoQuota = buildQuotaPayload({ mode, maxAnalyses, contactEmail, used: 0, banned: false });
      return next();
    }

    const ipHash = getClientIpHash(req);
    const state = await readState(storageDir, ipHash, maxAnalyses);
    const locked = Boolean(state.banned) || state.used >= maxAnalyses;

    if (locked) {
      const lockedState = {
        ...state,
        used: Math.max(state.used, maxAnalyses),
        banned: true,
        bannedAt: state.bannedAt || new Date().toISOString(),
        limit: maxAnalyses,
      };
      await writeState(storageDir, ipHash, lockedState);

      req.demoQuota = buildQuotaPayload({
        mode,
        maxAnalyses,
        contactEmail,
        used: lockedState.used,
        banned: true,
      });

      return res.status(429).json({
        error: 'demo_quota_exceeded',
        message: `Generation limit reached. This IP is permanently banned. Contact ${contactEmail} to request unlock.`,
        limit: maxAnalyses,
        remaining: 0,
        used: lockedState.used,
        banned: true,
        contactEmail,
        mode,
      });
    }

    const nextUsed = state.used + 1;
    const nextState = {
      ...state,
      used: nextUsed,
      banned: nextUsed >= maxAnalyses,
      bannedAt: nextUsed >= maxAnalyses ? new Date().toISOString() : state.bannedAt || null,
      limit: maxAnalyses,
    };
    await writeState(storageDir, ipHash, nextState);

    req.demoQuota = buildQuotaPayload({
      mode,
      maxAnalyses,
      contactEmail,
      used: nextUsed,
      banned: nextState.banned,
    });

    return next();
  })().catch(next);
}

export function getDemoQuota(req, res, next) {
  void (async () => {
    const { mode, maxAnalyses, contactEmail, storageDir } = demoQuotaConfig();

    if (mode === 'unlimited') {
      return res.json({
        mode,
        limit: Infinity,
        used: 0,
        remaining: Infinity,
        exceeded: false,
        banned: false,
        contactEmail,
        storageDir,
      });
    }

    const ipHash = getClientIpHash(req);
    const state = await readState(storageDir, ipHash, maxAnalyses);
    const banned = Boolean(state.banned) || state.used >= maxAnalyses;

    return res.json({
      mode,
      limit: maxAnalyses,
      used: Math.min(state.used, maxAnalyses),
      remaining: banned ? 0 : Math.max(0, maxAnalyses - state.used),
      exceeded: banned,
      banned,
      bannedAt: state.bannedAt,
      contactEmail,
      storageDir,
      unlock: banned ? { via: 'email', contactEmail } : null,
    });
  })().catch((error) => {
    if (next) return next(error);
    return res.status(500).json({ error: 'demo_quota_read_failed', message: error.message });
  });
}

export function resetDemoQuota(req, res) {
  return res.status(410).json({
    error: 'demo_quota_reset_disabled',
    message: 'Demo quota reset is disabled. Unlocks require manual email review.',
    contactEmail: demoQuotaConfig().contactEmail,
  });
}
