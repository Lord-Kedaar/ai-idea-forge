# AI Idea Forge

Modularny workflow do generowania **Decision Memo** przez multi-agent AI pipeline.

## Stack

- **Backend**: Express.js + Node.js 22 (ESM)
- **Frontend**: React 18 + Vite
- **AI Provider**: Ollama-compatible API (oMLX) lub fake provider offline

## Wymagania

- Node.js 22+
- Opcjonalnie: oMLX-compatible AI API (np. Ollama na innym hoście)

## Uruchomienie (offline / fake provider)

```bash
# 1. Zainstaluj zależności
cd ai-idea-forge
npm install --legacy-peer-deps

# 2. Start backend (domyślny provider=fake, nie wymaga LLM)
node backend/src/server.js
# → http://localhost:3210

# 3. Start frontend (oddzielny terminal)
cd frontend
npm install --legacy-peer-deps
npm run dev
# → http://localhost:5173
```

## Uruchomienie z realnym LLM (oMLX)

1. Ustaw `OMLX_BASE_URL` w `.env` na adres hosta z uruchomionym oMLX:
   ```
   DEFAULT_PROVIDER=omlx
   OMLX_BASE_URL=http://192.168.x.x:11434
   ```
2. Zrestartuj backend

## Struktura

```
ai-idea-forge/
├── backend/src/
│   ├── agents/        # agent definitions + prompts
│   ├── artifacts/      # decision memo builder
│   ├── config/         # env + defaults
│   ├── orchestration/ # run engine, state, events
│   ├── providers/      # fake + omlx providers
│   ├── routes/        # API endpoints
│   ├── storage/       # filesystem run storage
│   ├── transports/    # SSE helpers
│   └── utils/         # ids, errors, text guards, timeouts
├── frontend/src/
│   ├── components/    # IdeaInput, RunProgress, etc.
│   └── api.js
├── docs/              # architecture, API, runbook
├── data/runs/         # run artifacts (gitignored)
└── tests/             # jest unit tests
```

## Testy

```bash
NODE_OPTIONS='--experimental-vm-modules' node node_modules/.bin/jest
# 13/13 tests pass
```

## API

- `GET  /health` — liveness
- `GET  /api/providers` — lista providerów
- `GET  /api/agents` — lista agentów
- `GET  /api/workflows` — lista workflow
- `POST /api/forge/runs` — tworzy run (body: {workflowType, idea, context?, constraints?})
- `GET  /api/forge/runs/:runId` — status run
- `GET  /api/forge/runs/:runId/events` — SSE stream
- `GET  /api/forge/runs/:runId/artifacts/decision-memo` — DECISION_MEMO.md

## Workflows

| ID | Nazwa | Agenci |
|---|---|---|
| develop_idea | Rozwijacz | generator → pragmatist → decider |
| critique_idea | Krytyk | generator → skeptic → decider |
| premortem | Pre-mortem | generator → skeptic → redteam |
| compare_variants | Komparator | generator → pragmatist → redteam → editor |
| decision_memo | Decision Memo (pełny) | generator → skeptic → pragmatist → redteam → editor → decider |

## Dokumentacja

- `docs/ARCHITECTURE.md` — architektura systemu
- `docs/API.md` — referencja API
- `docs/LOCAL_SETUP.md` — instrukcja uruchomienia
- `docs/RUNBOOK.md` — operacyjne procedury
- `docs/PRODUCT_SCOPE.md` — zakres produktu
