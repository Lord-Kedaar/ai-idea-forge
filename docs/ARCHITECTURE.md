# Architektura — AI Idea Forge

## Overwiew

Modularny monolith. Cała logika biznesowa żyje w backendzie Express.js. Frontend to stateless React SPA komunikujący się z API przez HTTP + SSE.

## Warstwy

```
┌─────────────────────────────────┐
│     React SPA (Vite dev server) │
│     localhost:5173 → proxy 3210 │
└──────────────┬──────────────────┘
               │ HTTP + SSE
┌──────────────▼──────────────────┐
│       Express.js API            │
│  /health  /api/providers        │
│  /api/agents  /api/workflows    │
│  /api/forge/runs  (POST/GET/SSE)│
│  /api/forge/runs/:id/artifacts  │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│   Provider Abstraction Layer    │
│   (OpenAILike compatible)       │
└──────────────┬──────────────────┘
               │
        ┌──────▼──────┐
        │ OMLX API    │
        │ localhost   │
        │ :8585       │
        └─────────────┘
```

## Struktura katalogów backend

```
backend/src/
├── server.js        # Entrypoint — createApp + listen
├── createApp.js     # Factory app Express
├── config/
│   ├── env.js       # Ładowanie + walidacja env
│   └── defaults.js  # Wartości domyślne
├── routes/
│   ├── health.js
│   ├── providers.js
│   ├── agents.js
│   ├── workflows.js
│   ├── forgeRuns.js   # POST /runs, GET /runs/:id, GET /runs/:id/events
│   └── artifacts.js   # GET /runs/:id/artifacts/decision-memo
└── utils/
    ├── ids.js
    ├── errors.js
    ├── textGuards.js
    └── timeouts.js
```

## Flow żądania (Forge Run)

1. `POST /api/forge/runs` — tworzy nowy run, zwraca `runId`
2. Frontend nawiązuje SSE po `/api/forge/runs/:runId/events`
3. Backend orkiestruje agentów → provider → odpowiedź
4. SSE streamuje etapy + output agentów
5. Final artifact → Decision Memo zapisany w `data/runs/:runId/`

## Zasady

- ESM modules (type: module w package.json)
- Kod produkcyjny bez console.log (używaj LOG_LEVEL)
- Walidacja env w config/env.js — błąd przy starcie jeśli brakuje wymaganych
