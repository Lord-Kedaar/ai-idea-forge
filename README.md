# AI Idea Forge

A modular workflow for generating **Decision Memos** through a multi-agent AI pipeline.

## Stack

- **Backend**: Express.js + Node.js 22 (ESM)
- **Frontend**: React 18 + Vite
- **LLM API Provider**: for offline use 2013 oMLX with local models; for on-line use 2013 FreeLLMAPI router to available free tier API providers.

## Requirements

- Node.js 22+
- Optional: oMLX-compatible AI API (e.g. Ollama running on another host)

## Demo & Portfolio Context

AI Idea Forge is part of the **Privacy-First AI Portfolio** by Radosław Pleskot. It runs locally on your infrastructure — no data leaves your network. The app is designed as a demonstration of modular AI pipeline architecture using a decoupled provider abstraction (fake / oMLX / FreeLLMAPI).

## Running (offline / fake provider)

```bash
# 1. Install dependencies
cd ai-idea-forge
npm install --legacy-peer-deps

# 2. Start backend (default provider=fake, no LLM required)
node backend/src/server.js
# → http://localhost:3210

# 3. Start frontend (separate terminal)
cd frontend
npm install --legacy-peer-deps
npm run dev
# → http://localhost:5173
```

## Running with a real LLM (oMLX)

1. Set `OMLX_BASE_URL` in `.env` to the host running oMLX:
   ```
   DEFAULT_PROVIDER=omlx
   OMLX_BASE_URL=http://192.168.x.x:11434
   ```
2. Restart the backend

## Project Structure

```
ai-idea-forge/
├── backend/src/
│   ├── agents/        # agent definitions + prompts
│   ├── artifacts/     # decision memo builder
│   ├── config/        # env + defaults
│   ├── middleware/    # rate limiting
│   ├── orchestration/ # run engine, state, events
│   ├── providers/     # fake + omlx + freellmapi providers
│   ├── routes/        # API endpoints
│   ├── storage/       # filesystem run storage
│   ├── transports/    # SSE helpers
│   └── utils/         # ids, errors, text guards, timeouts
├── frontend/src/
│   ├── components/    # (inline in App.jsx)
│   ├── i18n/         # translations (en, de, pl)
│   └── App.jsx, api.js, markdown.js, theme.css
├── docs/             # architecture, API, runbook
├── data/runs/        # run artifacts (gitignored)
└── tests/            # jest unit tests
```

## Tests

```bash
NODE_OPTIONS='--experimental-vm-modules' node node_modules/.bin/jest
# 13/13 tests pass
```

## API

- `GET  /health` — liveness check
- `GET  /api/providers` — list AI providers
- `GET  /api/agents` — list agents
- `GET  /api/workflows` — list workflows
- `GET  /api/rate-limit` — current rate limit status (remaining requests)
- `POST /api/forge/runs` — create a run (body: {workflowType, idea, context?, constraints?})
- `GET  /api/forge/runs` — list all runs
- `GET  /api/forge/runs/:runId` — run status
- `DELETE /api/forge/runs/:runId` — delete a run
- `GET  /api/forge/runs/:runId/events` — SSE event stream
- `GET  /api/forge/runs/:runId/artifacts/decision-memo` — DECISION_MEMO.md artifact

## Workflows

| ID | Name | Agents |
|---|---|---|
| develop_idea | Developer | generator → pragmatist → decider |
| critique_idea | Critic | generator → skeptic → decider |
| premortem | Pre-mortem | generator → skeptic → redteam |
| compare_variants | Comparator | generator → pragmatist → redteam → editor |
| decision_memo | Decision Memo (full) | generator → skeptic → pragmatist → redteam → editor → decider |

## Internationalization

The UI supports three languages: **English**, **Deutsch**, and **Polski**. The language selector is in the header. Language preference is persisted in localStorage and defaults to the browser's detected language (fallback: Polski).

## Rate Limits

The demo is protected against token burn-out from accidental usage:

- **Per IP**: max 10 requests / hour
- **Per IP**: max 100 requests / day
- **Per session**: 1 active pipeline at a time (30s cooldown)
- **UI notice**: remaining requests shown in the header

## Documentation

- `docs/ARCHITECTURE.md` — system architecture
- `docs/API.md` — API reference
- `docs/LOCAL_SETUP.md` — setup instructions
- `docs/RUNBOOK.md` — operational procedures
- `docs/PRODUCT_SCOPE.md` — product scope

## Related

- **Privacy-First AI Portfolio**: https://github.com/RadoslawPleskot/privacy-first-ai-portfolio
- **AI Idea Forge**: https://github.com/Lord-Kedaar/ai-idea-forge
