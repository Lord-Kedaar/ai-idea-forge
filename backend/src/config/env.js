/**
 * AI Idea Forge — env.js
 * Ładowanie i walidacja zmiennych środowiskowych.
 */

import 'dotenv/config';
import { config } from './defaults.js';

const num = (value, fallback) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

const bool = (value, fallback) => {
  if (value === undefined || value === null) return fallback;
  return value === 'true' || value === '1';
};

const REQUIRED = [];

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  host: process.env.HOST || config.backend.host,
  port: num(process.env.PORT, config.backend.port),

  // Active provider selection
  defaultProvider: process.env.DEFAULT_PROVIDER || config.provider.name,
  defaultModel: process.env.DEFAULT_MODEL || '',

  // oMLX (Ollama-compatible local)
  omlxBaseUrl: process.env.OMLX_BASE_URL || config.omlx.baseUrl,
  omlxApiKey: process.env.OMLX_API_KEY || config.omlx.apiKey,
  omlxModel: process.env.OMLX_MODEL || config.omlx.model,

  // Groq
  groqApiKey: process.env.GROQ_API_KEY || config.groq.apiKey,

  // Mistral La Plateforme
  mistralApiKey: process.env.MISTRAL_API_KEY || config.mistral.apiKey,

  // FreeLLMApi (OpenAI-compatible remote)
  freellmapiBaseUrl: process.env.FREELLMAPI_BASE_URL || config.freellmapi.baseUrl,
  freellmapiApiKey: process.env.FREELLMAPI_API_KEY || config.freellmapi.apiKey,
  freellmapiModel: process.env.FREELLMAPI_MODEL || config.freellmapi.model,

  // Run storage / limits
  runStorageDir: process.env.RUN_STORAGE_DIR || config.run.storageDir,
  maxAgentsPerRun: num(process.env.MAX_AGENTS_PER_RUN, config.run.maxAgentsPerRun),
  maxAgentOutputTokens: num(process.env.MAX_AGENT_OUTPUT_TOKENS, config.run.maxAgentOutputTokens),
  turnTimeoutMs: num(process.env.TURN_TIMEOUT_MS, config.run.turnTimeoutMs),
  runTimeoutMs: num(process.env.RUN_TIMEOUT_MS, config.run.runTimeoutMs),
  providerRetryAttempts: num(process.env.PROVIDER_RETRY_ATTEMPTS, config.run.retryAttempts),

  // Misc
  enableSse: bool(process.env.ENABLE_SSE, config.sse.enable),
  logLevel: process.env.LOG_LEVEL || config.log.level,
};

const missing = REQUIRED.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error(`[AI Idea Forge] Brakujące wymagane zmienne env: ${missing.join(', ')}`);
  process.exit(1);
}

export const loadEnv = () => env;
export default env;
