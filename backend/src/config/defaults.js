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
    baseUrl: 'http://localhost:11434',
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
};
