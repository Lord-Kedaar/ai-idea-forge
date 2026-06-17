# API Reference — AI Idea Forge

Base URL: `http://localhost:3210`

## Health

### GET /health

Liveness check.

**Response 200:**
```json
{
  "status": "ok",
  "timestamp": "2026-06-14T12:00:00.000Z"
}
```

---

## Providers

### GET /api/providers

Lista dostępnych AI providerów.

**Response 200:**
```json
{
  "providers": [
    { "id": "omlx", "name": "OMLX", "models": ["..."] }
  ]
}
```

---

## Agents

### GET /api/agents

Lista skonfigurowanych agentów z profilami generacji.

**Response 200:**
```json
{
  "agents": [
    {
      "id": "context-analyst",
      "name": "Context Analyst",
      "description": "Analizuje tło i powiązania tematu",
      "profile": { "temperature": 0.4, "max_tokens": 1000 }
    }
  ]
}
```

---

## Workflows

### GET /api/workflows

Lista dostępnych trybów workflow.

**Response 200:**
```json
{
  "workflows": [
    { "id": "quick-insight", "name": "Quick Insight", "agents": ["context-analyst", "decision-mapper", "idea-consolidator"] },
    { "id": "deep-analysis", "name": "Deep Analysis", "agents": ["..."] },
    { "id": "creative-spark", "name": "Creative Spark", "agents": ["..."] },
    { "id": "expert-review", "name": "Expert Review", "agents": ["..."] },
    { "id": "custom", "name": "Custom", "agents": [] }
  ]
}
```

---

## Forge Runs

### POST /api/forge/runs

Tworzy nowy forge run.

**Request body:**
```json
{
  "idea": "string (required)",
  "workflow": "quick-insight | deep-analysis | creative-spark | expert-review | custom",
  "context": "string (optional)",
  "constraints": "string (optional)",
  "selectedAgents": ["agent-id"] // dla custom workflow
}
```

**Response 201:**
```json
{
  "runId": "abc123",
  "status": "pending",
  "createdAt": "2026-06-14T12:00:00.000Z"
}
```

---

### GET /api/forge/runs/:runId

Pobiera status run.

**Response 200:**
```json
{
  "runId": "abc123",
  "status": "running | completed | failed",
  "workflow": "quick-insight",
  "idea": "...",
  "agents": ["context-analyst", "decision-mapper"],
  "createdAt": "2026-06-14T12:00:00.000Z",
  "completedAt": null
}
```

---

### GET /api/forge/runs/:runId/events

SSE stream z eventami run.

**Event types:** `agent_started`, `chunk`, `agent_complete`, `artifact_ready`, `run_complete`, `error`

---

## Artifacts

### GET /api/forge/runs/:runId/artifacts/decision-memo

Pobiera wygenerowane Decision Memo.

**Response 200:**
```markdown
# Decision Memo: ...

## Context
...
```

**Response 404:**
```json
{ "error": "Artifact not found" }
```
