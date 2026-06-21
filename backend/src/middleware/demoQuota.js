/**
 * AI Idea Forge — Demo Quota Middleware
 *
 * Enforces a hard limit of N analyses per IP address when DEMO_QUOTA_MODE="limited".
 * Single canonical configuration location: backend/src/config/defaults.js → config.demoQuota
 *
 * Architecture:
 *  - "Source of truth" is ALWAYS the server (filesystem-backed counter).
 *  - Frontend may display the remaining count but NEVER enforces the limit.
 *  - Cookie (forge_demo_acknowledged) stores only "user has seen the notice".
 *    It does NOT enforce the limit — that would be a "plasticine lock".
 *
 * Storage: one JSON file per IP, stored in data/demo_quota/
 *   { "count": N, "updatedAt": "ISO timestamp", "ipHash": "..." }
 *
 * IP resolution (reverse-proxy aware):
 *   - Reads X-Forwarded-For (first IP), X-Real-IP
 *   - Falls back to req.socket.remoteAddress
 *   - Does NOT trust X-Forwarded-For blindly — if all three headers are absent,
 *     the request is considered direct and the socket address is used.
 */

import { createHash } from 'crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadEnv } from '../config/env.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data', 'demo_quota');

// ── Config ──────────────────────────────────────────────────────────────────

let _cfg = null;
function cfg() {
  if (!_cfg) _cfg = loadEnv();
  return _cfg;
}

/** DEMO_QUOTA_MODE = "limited" | "unlimited" (from env, with fallback to defaults) */
export function demoQuotaMode() {
  return cfg().demoQuotaMode || 'limited';
}

export function demoQuotaConfig() {
  return {
    mode: demoQuotaMode(),
    maxAnalyses: cfg().demoQuotaMaxAnalyses || 6,
    contactEmail: cfg().demoQuotaContactEmail || 'kontakt@radoslaw-pleskot.com',
    cookieName: cfg().demoQuotaCookieName || 'forge_demo_acknowledged',
  };
}

// ── IP handling ─────────────────────────────────────────────────────────────

/**
 * Returns a pseudo-anonymous IP identifier.
 * - For direct connections: hash of (IP + User-Agent) so the same user on different
 *   days still counts toward the same bucket without storing raw IP.
 * - For proxy connections with X-Forwarded-For: the first IP is used directly
 *   (already disclosed by the proxy), hashed with UA.
 *
 * We store only the hash, never the raw IP.
 */
export function getClientIpHash(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const remoteAddr = req.socket?.remoteAddress || 'unknown';

  let ip;
  if (forwarded) {
    ip = forwarded.split(',')[0].trim();
  } else if (realIp) {
    ip = realIp.trim();
  } else {
    ip = remoteAddr;
  }

  const ua = req.headers['user-agent'] || '';
  return createHash('sha256').update(`${ip}::${ua}`).digest('hex').slice(0, 32);
}

// ── Storage ──────────────────────────────────────────────────────────────────

function ensureDataDir() {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {}
}

function ipFilePath(ipHash) {
  return join(DATA_DIR, `${ipHash}.json`);
}

function readCounter(ipHash) {
  const path = ipFilePath(ipHash);
  try {
    if (existsSync(path)) {
      const raw = readFileSync(path, 'utf-8');
      const data = JSON.parse(raw);
      return { count: data.count || 0, updatedAt: data.updatedAt };
    }
  } catch {}
  return { count: 0, updatedAt: null };
}

function writeCounter(ipHash, count) {
  ensureDataDir();
  const path = ipFilePath(ipHash);
  const data = { count, ipHash, updatedAt: new Date().toISOString() };
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
}

// ── Middleware ─────────────────────────────────────────────────────────────

/**
 * demoQuotaMiddleware — enforces the per-IP analysis limit on POST /api/forge/runs.
 *
 * Attaches to req:
 *   req.demoQuota = { remaining, limit, exceeded, mode }
 */
export function demoQuotaMiddleware(req, res, next) {
  // Only enforce on actual run creation attempts
  if (req.method !== 'POST' || !req.path.includes('/forge/runs')) {
    return next();
  }

  const { mode, maxAnalyses } = demoQuotaConfig();

  // unlimited → skip all enforcement
  if (mode === 'unlimited') {
    req.demoQuota = { remaining: Infinity, limit: Infinity, exceeded: false, mode };
    return next();
  }

  const ipHash = getClientIpHash(req);
  const { count } = readCounter(ipHash);
  const remaining = Math.max(0, maxAnalyses - count);
  const exceeded = count >= maxAnalyses;

  req.demoQuota = { remaining, limit: maxAnalyses, exceeded, mode, ipHash, count };

  if (exceeded) {
    const retryAfter = 86400;
    res.set('X-DemoQuota-Limit', String(maxAnalyses));
    res.set('X-DemoQuota-Remaining', '0');
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({
      error: 'demo_quota_exceeded',
      message: 'Demo limit reached. Try again tomorrow or contact for more analyses.',
      remaining: 0,
      limit: maxAnalyses,
      contactEmail: demoQuotaConfig().contactEmail,
    });
  }

  // Count consumed AFTER the request passes through successfully
  res.on('finish', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const current = readCounter(ipHash).count;
      writeCounter(ipHash, current + 1);
    }
  });

  next();
}

// ── API endpoint ─────────────────────────────────────────────────────────────

/**
 * GET /api/demo-quota
 * Returns current quota status for this IP.
 * Safe to call — does NOT consume a count.
 */
export function getDemoQuota(req, res) {
  const { mode, maxAnalyses, contactEmail, cookieName } = demoQuotaConfig();

  if (mode === 'unlimited') {
    return res.json({
      mode: 'unlimited',
      limit: Infinity,
      remaining: Infinity,
      exceeded: false,
      contactEmail,
    });
  }

  const ipHash = getClientIpHash(req);
  const { count } = readCounter(ipHash);
  const remaining = Math.max(0, maxAnalyses - count);
  const exceeded = count >= maxAnalyses;

  return res.json({
    mode: 'limited',
    limit: maxAnalyses,
    remaining,
    exceeded,
    count,
    contactEmail,
    cookieName,
  });
}

/**
 * DELETE /api/demo-quota
 * Admin reset — clears the counter for the current IP.
 */
export function resetDemoQuota(req, res) {
  const ipHash = getClientIpHash(req);
  writeCounter(ipHash, 0);
  const { count } = readCounter(ipHash);
  res.json({ ok: true, count, message: 'Counter reset.' });
}
