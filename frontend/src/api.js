/**
 * AI Idea Forge — API client (DIRECT BACKEND)
 *
 * Fetch directly do backendu zamiast przez Vite proxy.
 * Powód: cache przeglądarki psuje /api/* przez proxy w dev.
 *
 * API_BASE jest ustawiane na:
 * - production: https://lenovo-server.tailc245b7.ts.net:4000
 * - development: http://localhost:3210 (lub z VITE_API_BASE)
 *
 * Vite CORS proxy nie jest już potrzebny — backend ma app.use(cors()).
 */

const DEFAULT_BACKEND = 'http://localhost:3210';
// Kiedy aplikacja jest hostowana na Tailscale HTTPS, użyj tego samego origin
// (relative path → browser wysyła do tego samego hosta co HTML)
const API_BASE = import.meta.env.VITE_API_BASE || '';

// === FALLBACK DEV DATA ===
const DEV_PROVIDERS = {
  activeProvider: 'fake',
  providers: [
    { id: 'fake', name: 'FAKE', description: 'Offline / testy', isActive: true },
    { id: 'omlx', name: 'oMLX', description: 'Lokalny oMLX (Ollama-compatible)', isActive: false, baseUrl: 'http://localhost:11434' },
    { id: 'freellmapi', name: 'FreeLLMApi', description: 'Zdalny OpenAI-compatible', isActive: false, baseUrl: 'https://api.freellmapi.com', defaultModel: 'auto' },
  ],
  providerConfig: { model: null },
  __fallback: 'dev-data',
};

const DEV_AGENTS = {
  agents: [
    { id: 'generator', name: 'Generator', description: 'Rozwija pomysł, proponuje warianty, szuka szans.' },
    { id: 'skeptic', name: 'Sceptyk', description: 'Szuka słabych punktów, ujawnia ukryte założenia.' },
    { id: 'pragmatist', name: 'Pragmatyk', description: 'Sprawdza wykonalność i minimalny eksperyment.' },
    { id: 'redteam', name: 'Red Team', description: 'Pre-mortem i identyfikacja ryzyk.' },
    { id: 'editor', name: 'Redaktor', description: 'Porządkuje materiał i usuwa powtórzenia.' },
    { id: 'decider', name: 'Decydent', description: 'Formułuje rekomendację, status, następny krok.' },
  ],
};

const DEV_WORKFLOWS = {
  workflows: [
    { id: 'develop_idea', name: 'Rozwiń pomysł', description: 'Warianty, szanse, odbiorcy i możliwe kierunki.', agents: ['generator', 'editor'] },
    { id: 'critique_idea', name: 'Skrytykuj pomysł', description: 'Słabe punkty, ukryte założenia i pytania otwarte.', agents: ['generator', 'skeptic', 'decider'] },
    { id: 'premortem', name: 'Pre-mortem', description: 'Załóżmy, że projekt zawiódł. Dlaczego?', agents: ['generator', 'skeptic', 'redteam'] },
    { id: 'compare_variants', name: 'Porównaj warianty', description: 'Porównanie opcji, ryzyk i warunków wyboru.', agents: ['generator', 'pragmatist', 'redteam', 'editor'] },
    { id: 'decision_memo', name: 'Decision Memo', description: 'Przygotuj uporządkowaną rekomendację i następny krok.', agents: ['generator', 'skeptic', 'pragmatist', 'redteam', 'editor', 'decider'] },
  ],
};

async function fetchJson(path, opts = {}, { onBackendDown } = {}) {
  const fullUrl = `${API_BASE}${path}`;
  try {
    const res = await fetch(fullUrl, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      cache: 'no-store',  // wyłącz cache przeglądarki
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return { data: await res.json(), ok: true };
  } catch (e) {
    onBackendDown?.(e);
    return { data: null, ok: false, error: e };
  }
}

export async function getHealth(onBackendDown) {
  return fetchJson('/health', {}, { onBackendDown });
}

export async function getProviders(onBackendDown) {
  const r = await fetchJson('/api/providers', {}, { onBackendDown });
  if (!r.ok) return { ...DEV_PROVIDERS, _backendDown: true };
  return r.data;
}

export async function getAgents(onBackendDown) {
  const r = await fetchJson('/api/agents', {}, { onBackendDown });
  if (!r.ok) return { ...DEV_AGENTS, _backendDown: true };
  return r.data;
}

export async function getWorkflows(onBackendDown) {
  const r = await fetchJson('/api/workflows', {}, { onBackendDown });
  if (!r.ok) return { ...DEV_WORKFLOWS, _backendDown: true };
  return r.data;
}

export async function createRun({ workflowType, idea, context, constraints }) {
  const res = await fetch(`${API_BASE}/api/forge/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workflowType, idea, context, constraints }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export async function getRun(runId) {
  const res = await fetch(`${API_BASE}/api/forge/runs/${runId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getDecisionMemo(runId) {
  const res = await fetch(`${API_BASE}/api/forge/runs/${runId}/artifacts/decision-memo`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export async function getRunsList() {
  try {
    const res = await fetch(`${API_BASE}/api/forge/runs`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return { runs: [] };
  }
}

export function subscribeRunEvents(runId, { onEvent, onError } = {}) {
  const url = `${API_BASE}/api/forge/runs/${runId}/events`;
  let es;
  try {
    es = new EventSource(url);
  } catch (e) {
    onError?.(e);
    return { source: null, close: () => {} };
  }
  es.onmessage = (e) => {
    try {
      const payload = JSON.parse(e.data);
      const type = payload.type || 'message';
      onEvent?.(type, payload);
    } catch (err) {
      if (typeof e.data === 'string' && e.data.startsWith(':')) return;
      onError?.(err);
    }
  };
  es.onerror = (e) => {
    const readyState = es?.readyState;
    if (readyState === EventSource.CLOSED) return; // normal end-of-stream
    onError?.(e);
  };
  return { source: es, close: () => es.close() };
}

export function pollRun(runId, { onUpdate, interval = 2000, onError } = {}) {
  let stopped = false;
  let timer = null;
  async function tick() {
    if (stopped) return;
    try {
      const data = await getRun(runId);
      onUpdate?.(data);
    } catch (e) {
      onError?.(e);
    }
    if (!stopped) timer = setTimeout(tick, interval);
  }
  tick();
  return { stop: () => { stopped = true; if (timer) clearTimeout(timer); } };
}

export function subscribeRunWithFallback(runId, { onEvent, onUpdate, onError, pollingInterval = 2000 } = {}) {
  let polling = null;
  let sseActive = false;
  const sub = subscribeRunEvents(runId, {
    onEvent: (type, data) => { sseActive = true; onEvent?.(type, data); },
    onError: (err) => {
      const es = sub.source;
      if (es && es.readyState === EventSource.CLOSED) return;
      if (!polling) {
        polling = pollRun(runId, { onUpdate: (data) => onUpdate?.(data), interval: pollingInterval, onError: (e) => onError?.(e) });
      }
      onError?.(err);
    },
  });
  const safety = setTimeout(() => {
    if (!sseActive && !polling) {
      polling = pollRun(runId, { onUpdate: (data) => onUpdate?.(data), interval: pollingInterval });
    }
  }, 4000);
  return () => {
    clearTimeout(safety);
    sub.close();
    polling?.stop();
  };
}
