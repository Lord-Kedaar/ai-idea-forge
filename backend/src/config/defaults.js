/**
 * AI Idea Forge — konfiguracja domyślna
 */

export const config = {
  backend: {
    host: '0.0.0.0',
    port: 3210,
  },
  provider: {
    name: 'freellmapi', // aktualny provider roboczy
  },
  omlx: {
    baseUrl: 'http://localhost:8585',
    apiKey: '',
    model: 'gemma-4-26B-A4B-it-QAT-MLX-4bit',
  },
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKey: '',
  },
  mistral: {
    baseUrl: 'https://api.mistral.ai/v1',
    apiKey: '',
  },
  freellmapi: {
    baseUrl: 'https://api.freellmapi.com',
    apiKey: '',
    model: 'auto', // serwer wybiera model automatycznie
  },
  run: {
    storageDir: './data/runs',
    maxAgentsPerRun: 6,
    maxAgentOutputTokens: 1200,
    turnTimeoutMs: 120000,
    runTimeoutMs: 600000,
    retryAttempts: 1,
  },
  sse: {
    enable: true,
  },
  log: {
    level: 'info',
  },
  demoQuota: {
    mode: 'limited',          // 'limited' = 6 analyses/IP, 'unlimited' = no limit
    maxAnalyses: 6,
    contactEmail: 'kontakt@radoslaw-pleskot.com',
    cookieName: 'forge_demo_acknowledged',
    storageDir: './data/demo_quota',
  },
};
