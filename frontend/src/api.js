const API_BASE = import.meta.env.VITE_API_BASE || '';

const DEV_PROVIDERS = {
  activeProvider: 'fake',
  providers: [
    { id: 'fake', name: 'FAKE', description: 'Offline / tests', isActive: true },
    { id: 'omlx', name: 'oMLX', description: 'Local oMLX', isActive: false, baseUrl: 'http://localhost:11434' },
    { id: 'freellmapi', name: 'FreeLLMApi', description: 'OpenAI-compatible remote API', isActive: false, baseUrl: 'https://api.freellmapi.com', defaultModel: 'auto' },
  ],
  providerConfig: { model: null },
  __fallback: 'dev-data',
};

const DEV_AGENTS = {
  agents: [
    { id: 'generator', name: 'Generator', description: 'Develops the idea and variants.' },
    { id: 'skeptic', name: 'Skeptic', description: 'Finds weak points and hidden assumptions.' },
    { id: 'pragmatist', name: 'Pragmatist', description: 'Checks feasibility and minimum experiment.' },
    { id: 'redteam', name: 'Red Team', description: 'Runs a pre-mortem and identifies risks.' },
    { id: 'editor', name: 'Editor', description: 'Structures the material and removes repetition.' },
    { id: 'decider', name: 'Decider', description: 'Creates the recommendation, status, and next step.' },
  ],
};

const DEV_WORKFLOWS = {
  workflows: [
    { id: 'develop_idea', name: 'Develop idea', description: 'Variants, opportunities, audiences, and directions.', agents: ['generator', 'editor', 'decider'] },
    { id: 'critique_idea', name: 'Critique idea', description: 'Weak points, hidden assumptions, and open questions.', agents: ['skeptic', 'pragmatist', 'editor', 'decider'] },
    { id: 'premortem', name: 'Pre-mortem', description: 'Assume the project failed. Why?', agents: ['redteam', 'skeptic', 'pragmatist', 'editor', 'decider'] },
    { id: 'compare_variants', name: 'Compare variants', description: 'Compare options, risks, and selection conditions.', agents: ['generator', 'pragmatist', 'skeptic', 'editor', 'decider'] },
    { id: 'decision_memo', name: 'Quick Recommendation', description: 'A concise recommendation, decision and next step.', agents: ['pragmatist', 'editor', 'decider'] },
    { id: 'full_analysis', name: 'Full Analysis', description: 'Full pipeline: expansion, critique, feasibility, risks, editing and recommendation.', agents: ['generator', 'skeptic', 'pragmatist', 'redteam', 'editor', 'decider'] },
  ],
};

async function fetchJson(path, opts = {}, { onBackendDown } = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
      },
      cache: 'no-store',
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

export async function createRun({ workflowType, idea, context, constraints, language }) {
  const res = await fetch(`${API_BASE}/api/forge/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workflowType, idea, context, constraints, language }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export async function cancelRun(runId) {
  const res = await fetch(`${API_BASE}/api/forge/runs/${runId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}


export async function deleteRun(runId) {
  const res = await fetch(`${API_BASE}/api/forge/runs/${runId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export async function getRun(runId) {
  const res = await fetch(`${API_BASE}/api/forge/runs/${runId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export async function getRunsList() {
  const res = await fetch(`${API_BASE}/api/forge/runs`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export async function getDecisionMemo(runId) {
  const res = await fetch(`${API_BASE}/api/forge/runs/${runId}/artifacts/decision-memo`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.text();
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

  // Backend writes events as `data: {"type": "<name>", ...}\n\n` (single message stream).
  // Use onmessage and route by `payload.type`. `event:` (named events) are NOT used by backend.
  es.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      const type = payload.type || 'message';
      onEvent?.(type, payload);
    } catch (err) {
      if (typeof event.data === 'string' && event.data.startsWith(':')) return; // SSE comment / heartbeat
      onError?.(err);
    }
  };

  es.onerror = (event) => {
    if (es.readyState === EventSource.CLOSED) return; // normal end-of-stream
    onError?.(event);
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
      if (['completed', 'failed', 'cancelled'].includes(data.status)) return;
    } catch (e) {
      onError?.(e);
    }
    if (!stopped) timer = setTimeout(tick, interval);
  }

  tick();
  return {
    stop: () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
  };
}

export function subscribeRunWithFallback(runId, { onEvent, onUpdate, onError, pollingInterval = 2000 } = {}) {
  let polling = null;
  let closed = false;

  const startPolling = () => {
    if (polling || closed) return;
    polling = pollRun(runId, { onUpdate, interval: pollingInterval, onError });
  };

  const sub = subscribeRunEvents(runId, {
    onEvent: (type, data) => {
      onEvent?.(type, data);
      if (['run_completed', 'run_failed', 'run_cancelled'].includes(type)) {
        closed = true;
        sub.close();
        polling?.stop();
      }
    },
    onError: (err) => {
      startPolling();
      onError?.(err);
    },
  });

  const safety = setTimeout(startPolling, 3000);

  return () => {
    closed = true;
    clearTimeout(safety);
    sub.close();
    polling?.stop();
  };
}
