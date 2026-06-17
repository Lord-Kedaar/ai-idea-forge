/**
 * Rate limiting middleware — in-memory implementation.
 * Guards against token burn-out on the demo portfolio app.
 *
 * Limits:
 *  - Per IP: MAX_IP_REQUESTS per window (default 10/h)
 *  - Per IP per day: MAX_DAILY per IP (default 100)
 *  - Per session: 1 active pipeline run at a time (30s cooldown)
 */

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_IP_REQUESTS = 10;
const MAX_DAILY = 100;
const SESSION_COOLDOWN_MS = 30 * 1000;

const store = new Map();

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function cleanStore() {
  const now = Date.now();
  for (const [ip, data] of store.entries()) {
    if (now - data.hourWindow > RATE_LIMIT_WINDOW_MS * 2 && now - data.dayWindow > 86400000 * 2) {
      store.delete(ip);
    }
  }
}
setInterval(cleanStore, 10 * 60 * 1000);

export function rateLimitMiddleware(req, res, next) {
  const ip = getClientIp(req);
  const now = Date.now();

  if (!store.has(ip)) {
    store.set(ip, { hourCount: 0, hourWindow: now, dayCount: 0, dayWindow: now, sessions: new Map() });
  }
  const entry = store.get(ip);

  if (now - entry.hourWindow > RATE_LIMIT_WINDOW_MS) {
    entry.hourCount = 0;
    entry.hourWindow = now;
  }
  if (now - entry.dayWindow > 86400000) {
    entry.dayCount = 0;
    entry.dayWindow = now;
  }

  if (entry.dayCount >= MAX_DAILY) {
    res.set('X-RateLimit-Limit', String(MAX_DAILY));
    res.set('X-RateLimit-Remaining', '0');
    return res.status(429).json({
      error: 'rate_limit_daily',
      message: 'Daily request limit reached.',
      remaining: 0,
      limit: MAX_DAILY,
    });
  }

  if (entry.hourCount >= MAX_IP_REQUESTS) {
    const retryAfter = Math.ceil((entry.hourWindow + RATE_LIMIT_WINDOW_MS - now) / 1000);
    res.set('X-RateLimit-Limit', String(MAX_IP_REQUESTS));
    res.set('X-RateLimit-Remaining', '0');
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({
      error: 'rate_limit_hourly',
      message: 'Hourly request limit reached.',
      remaining: 0,
      limit: MAX_IP_REQUESTS,
      retryAfter,
    });
  }

  entry.hourCount++;
  entry.dayCount++;

  req.rateLimit = {
    ipRemaining: MAX_IP_REQUESTS - entry.hourCount,
    dailyRemaining: MAX_DAILY - entry.dayCount,
  };

  res.set('X-RateLimit-Limit', String(MAX_IP_REQUESTS));
  res.set('X-RateLimit-Remaining', String(MAX_IP_REQUESTS - entry.hourCount));

  next();
}

export function sessionLockMiddleware(req, res, next) {
  const ip = getClientIp(req);
  const now = Date.now();
  const entry = store.get(ip);

  if (entry?.sessions?.has('pipeline')) {
    const lockTime = entry.sessions.get('pipeline') || 0;
    if (now - lockTime < SESSION_COOLDOWN_MS) {
      return res.status(429).json({
        error: 'pipeline_in_progress',
        message: 'A pipeline is already running for this session.',
        retryAfter: Math.ceil((SESSION_COOLDOWN_MS - (now - lockTime)) / 1000),
      });
    }
  }

  if (entry) entry.sessions.set('pipeline', now);
  next();
}

export function releaseSessionLock(ip) {
  const entry = store.get(ip);
  if (entry) entry.sessions.delete('pipeline');
}

export function getRateLimitInfo(req) {
  const ip = getClientIp(req);
  const entry = store.get(ip);
  if (!entry) return { hourlyRemaining: MAX_IP_REQUESTS, dailyRemaining: MAX_DAILY };
  return {
    hourlyRemaining: Math.max(0, MAX_IP_REQUESTS - entry.hourCount),
    dailyRemaining: Math.max(0, MAX_DAILY - entry.dayCount),
  };
}
