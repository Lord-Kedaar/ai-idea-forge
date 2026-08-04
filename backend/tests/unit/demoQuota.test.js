import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { pathToFileURL } from 'url';

let demoQuotaMiddleware;
let getDemoQuota;
let resetDemoQuota;
let getClientIpHash;
let storageDir;

const originalEnv = {
  DEMO_QUOTA_MODE: process.env.DEMO_QUOTA_MODE,
  DEMO_QUOTA_MAX_ANALYSES: process.env.DEMO_QUOTA_MAX_ANALYSES,
  DEMO_QUOTA_CONTACT_EMAIL: process.env.DEMO_QUOTA_CONTACT_EMAIL,
  DEMO_QUOTA_COOKIE_NAME: process.env.DEMO_QUOTA_COOKIE_NAME,
  DEMO_QUOTA_STORAGE_DIR: process.env.DEMO_QUOTA_STORAGE_DIR,
};

function makeReq(method = 'POST', ip = '203.0.113.10') {
  return {
    method,
    path: '/api/forge/runs',
    originalUrl: '/api/forge/runs',
    headers: {
      'x-forwarded-for': ip,
    },
    socket: {
      remoteAddress: ip,
    },
  };
}

function makeRes() {
  const res = {
    statusCode: 200,
    payload: null,
    jsonCalled: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      this.jsonCalled = true;
      return this;
    },
  };
  return res;
}

function runMiddleware(fn, req, res) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = () => {
      if (!settled) {
        settled = true;
        resolve({ req, res });
      }
    };
    const next = (err) => {
      if (settled) return;
      if (err) {
        settled = true;
        reject(err);
        return;
      }
      finish();
    };

    res.json = (body) => {
      res.payload = body;
      res.jsonCalled = true;
      finish();
      return res;
    };

    try {
      const maybe = fn(req, res, next);
      if (maybe && typeof maybe.then === 'function') {
        maybe.catch((err) => {
          if (!settled) {
            settled = true;
            reject(err);
          }
        });
      }
    } catch (err) {
      if (!settled) {
        settled = true;
        reject(err);
      }
    }
  });
}

beforeAll(async () => {
  storageDir = await mkdtemp(join(tmpdir(), 'ai-idea-forge-demo-quota-'));
  process.env.DEMO_QUOTA_MODE = 'limited';
  process.env.DEMO_QUOTA_MAX_ANALYSES = '2';
  process.env.DEMO_QUOTA_CONTACT_EMAIL = 'kontakt@radoslaw-pleskot.com';
  process.env.DEMO_QUOTA_COOKIE_NAME = 'forge_demo_acknowledged';
  process.env.DEMO_QUOTA_STORAGE_DIR = storageDir;

  const mod = await import(pathToFileURL('/Users/radek/Documents/Projects/ai-idea-forge/backend/src/middleware/demoQuota.js').href + `?t=${Date.now()}`);
  demoQuotaMiddleware = mod.demoQuotaMiddleware;
  getDemoQuota = mod.getDemoQuota;
  resetDemoQuota = mod.resetDemoQuota;
  getClientIpHash = mod.getClientIpHash;
});

afterAll(async () => {
  await rm(storageDir, { recursive: true, force: true });
  Object.assign(process.env, originalEnv);
});

describe('Demo quota middleware', () => {
  it('limits each IP to two uses, then permanently bans it', async () => {
    const req1 = makeReq();
    const res1 = makeRes();
    let nextCount = 0;
    await runMiddleware(demoQuotaMiddleware, req1, res1).then(() => {
      nextCount += 1;
    });
    expect(nextCount).toBe(1);
    expect(req1.demoQuota.used).toBe(1);
    expect(req1.demoQuota.remaining).toBe(1);

    const req2 = makeReq();
    const res2 = makeRes();
    let nextCount2 = 0;
    await runMiddleware(demoQuotaMiddleware, req2, res2).then(() => {
      nextCount2 += 1;
    });
    expect(nextCount2).toBe(1);
    expect(req2.demoQuota.used).toBe(2);
    expect(req2.demoQuota.remaining).toBe(0);
    expect(req2.demoQuota.banned).toBe(true);

    const req3 = makeReq();
    const res3 = makeRes();
    await runMiddleware(demoQuotaMiddleware, req3, res3);
    expect(res3.statusCode).toBe(429);
    expect(res3.payload.error).toBe('demo_quota_exceeded');
    expect(res3.payload.banned).toBe(true);
    expect(res3.payload.remaining).toBe(0);
    expect(res3.payload.contactEmail).toBe('kontakt@radoslaw-pleskot.com');

    const req4 = makeReq();
    const res4 = makeRes();
    await runMiddleware(demoQuotaMiddleware, req4, res4);
    expect(res4.statusCode).toBe(429);
    expect(res4.payload.banned).toBe(true);
    expect(res4.payload.remaining).toBe(0);

    const ipHash = getClientIpHash(makeReq());
    const file = await readFile(join(storageDir, `${ipHash}.json`), 'utf8');
    const persisted = JSON.parse(file);
    expect(persisted.used).toBe(2);
    expect(persisted.banned).toBe(true);
  });

  it('exposes ban status and unlock email via quota endpoint', async () => {
    const req = makeReq('GET');
    const res = makeRes();
    await runMiddleware(getDemoQuota, req, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload.limit).toBe(2);
    expect(res.payload.used).toBe(2);
    expect(res.payload.banned).toBe(true);
    expect(res.payload.unlock).toEqual({ via: 'email', contactEmail: 'kontakt@radoslaw-pleskot.com' });
  });

  it('disables quota reset endpoint', async () => {
    const req = makeReq('DELETE');
    const res = makeRes();
    await runMiddleware(resetDemoQuota, req, res);

    expect(res.statusCode).toBe(410);
    expect(res.payload.error).toBe('demo_quota_reset_disabled');
    expect(res.payload.contactEmail).toBe('kontakt@radoslaw-pleskot.com');
  });
});
