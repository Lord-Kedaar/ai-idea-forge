import express from 'express';
import cors from 'cors';
import { loadEnv } from './config/env.js';
import { initProvider } from './providers/providerRegistry.js';
import healthRouter from './routes/health.js';
import providersRouter from './routes/providers.js';
import agentsRouter from './routes/agents.js';
import workflowsRouter from './routes/workflows.js';
import { createForgeRun, getForgeRun, getForgeRunEvents, listForgeRuns, deleteForgeRun } from './routes/forgeRuns.js';
import { getDecisionMemo } from './routes/artifacts.js';
import { rateLimitMiddleware, sessionLockMiddleware, getRateLimitInfo } from './middleware/rateLimit.js';

const env = loadEnv();

/**
 * Build provider-specific config from env.
 * Architecture stays provider-agnostic — no provider-specific code here.
 */
function buildProviderConfig(providerId) {
  switch (providerId) {
    case 'omlx':
      return {
        baseUrl: env.omlxBaseUrl,
        apiKey: env.omlxApiKey,
        model: env.defaultModel || undefined,
      };
    case 'freellmapi':
      return {
        baseUrl: env.freellmapiBaseUrl,
        apiKey: env.freellmapiApiKey,
        model: env.freellmapiModel || env.defaultModel || undefined,
      };
    case 'fake':
    default:
      return {
        model: env.defaultModel || undefined,
      };
  }
}

// Initialize provider
try {
  initProvider(env.defaultProvider, buildProviderConfig(env.defaultProvider));
  console.log(`[AI Idea Forge] Provider "${env.defaultProvider}" zainicjalizowany.`);
} catch (err) {
  console.warn(`[AI Idea Forge] Provider init warning: ${err.message}`);
}

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Access log
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  next();
});

// Health
app.get('/health', healthRouter);

// API
app.get('/api/providers', providersRouter);
app.get('/api/agents', agentsRouter);
app.get('/api/workflows', workflowsRouter);

// Forge runs
app.post('/api/forge/runs', rateLimitMiddleware, sessionLockMiddleware, createForgeRun);
app.get('/api/rate-limit', (req, res) => {  const info = getRateLimitInfo(req);  res.json({ ...info, hourlyLimit: 10, dailyLimit: 100 });});
app.get('/api/forge/runs', listForgeRuns);
app.get('/api/forge/runs/:runId', getForgeRun);
app.delete('/api/forge/runs/:runId', deleteForgeRun);
app.get('/api/forge/runs/:runId/events', getForgeRunEvents);
app.get('/api/forge/runs/:runId/artifacts/decision-memo', getDecisionMemo);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    code: err.code || `HTTP_${status}`,
  });
});

export default app;
