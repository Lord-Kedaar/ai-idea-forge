/**
 * AI Idea Forge — Providers route
 * GET /api/providers
 *
 * Returns all available providers (from registry) and the active one.
 * Each entry includes the public-safe base URL (no API key).
 */

import env from '../config/env.js';
import { listProviders } from '../providers/providerRegistry.js';

const PROVIDER_META = {
  fake: { name: 'FAKE', description: 'Offline / testy — brak realnego LLM' },
  omlx: { name: 'oMLX', description: 'Lokalny oMLX (Ollama-compatible API)' },
  freellmapi: { name: 'FreeLLMApi', description: 'Zdalny OpenAI-compatible API' },
};

function providerBaseUrl(id) {
  if (id === 'omlx') return env.omlxBaseUrl;
  if (id === 'freellmapi') return env.freellmapiBaseUrl;
  return null;
}

function providerDefaultModel(id) {
  if (id === 'freellmapi') return env.freellmapiModel || 'auto';
  return env.defaultModel || null;
}

export default function providersRouter(req, res) {
  const availableIds = listProviders();
  const providers = availableIds.map((id) => {
    const meta = PROVIDER_META[id] || { name: id.toUpperCase(), description: '' };
    return {
      id,
      name: meta.name,
      description: meta.description,
      baseUrl: providerBaseUrl(id),
      defaultModel: providerDefaultModel(id),
      isActive: id === env.defaultProvider,
    };
  });

  res.json({
    providers,
    activeProvider: env.defaultProvider,
    providerConfig: {
      // helpful metadata for the UI (no secrets)
      model: env.defaultModel || null,
    },
  });
}
