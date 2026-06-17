import app from './createApp.js';
import { loadEnv } from './config/env.js';

const env = loadEnv();
const server = app.listen(env.port, env.host, () => {
  console.log(`[AI Idea Forge] Backend started on ${env.host}:${env.port}`);
  console.log(`[AI Idea Forge] NODE_ENV=${env.nodeEnv}`);
});

process.on('SIGTERM', () => {
  console.log('[AI Idea Forge] SIGTERM received, shutting down...');
  server.close(() => process.exit(0));
});
