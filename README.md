# AI Idea Forge

A modular workflow for generating **Decision Memos** through a multi-agent AI pipeline. Takes an idea and produces a structured decision document via 6 specialized agents (Generator, Skeptic, Pragmatist, Red Team, Editor, Decider).

## Stack

- **Backend**: Express.js + Node.js 22 (ESM)
- **Frontend**: React 18 + Vite 6 + Tailwind CSS 3 (shadcn-style monochrome dark theme)
- **LLM API Provider**: for offline use oMLX with local models; for on-line use FreeLLMAPI router to available free tier API providers
- **Tests**: Jest with ESM

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
│   ├── agents/         # agent definitions + prompts
│   ├── artifacts/      # decision memo builder
│   ├── config/         # env + defaults
│   ├── middleware/     # rate limiting
│   ├── orchestration/  # run engine, state, events
│   ├── providers/      # fake + omlx + freellmapi providers
│   ├── routes/         # API endpoints
│   ├── storage/        # filesystem run storage
│   ├── transports/     # SSE helpers
│   └── utils/          # ids, errors, text guards, timeouts
├── frontend/src/
│   ├── components/     # SidebarNav, HeaderBar, AppShell, IdeaInputForm,
│   │                   # AnalysisProgress, DecisionMemoPanel, RunsHistoryPanel,
│   │                   # AnalysisExplainer, BackendStatus, PlaceholderView,
│   │                   # LanguageSwitcher, WorkflowCard, WorkflowSelector
│   ├── i18n/           # I18nProvider + translations (en, de, pl)
│   ├── App.jsx         # root component, active-tab routing
│   ├── api.js          # REST + SSE + polling fallback
│   ├── index.css       # Tailwind + shadcn-style tokens (dark monochrome)
│   ├── markdown.js     # XSS-safe renderer
│   ├── utils.js        # cn() helper (clsx + tailwind-merge)
│   └── workflows.js    # AGENT_META / AGENT_ORDER
├── design-reference/   # OpenDesign HTML/CSS prototype + README (visual reference)
├── docs/               # architecture, API, runbook
├── data/runs/          # run artifacts (gitignored)
└── tests/              # jest unit tests
```

## UI Tabs (Sidebar)

The sidebar has 6 tabs. Clicking a tab swaps the content of the main panel — only one tab is active at a time.

| Tab | Polish | Content |
|---|---|---|
| Idea | Pomysł | `IdeaInputForm` + `AnalysisExplainer` + top-5 recent runs + `BackendStatus` if down |
| Analysis | Analiza | `AnalysisProgress` (live stages + stop button) + `AnalysisExplainer` |
| Decision Memo | Decision Memo | `DecisionMemoPanel` (rendered markdown with copy/print/download actions) |
| History | Historia | `RunsHistoryPanel` — full table with filters (all / completed / running / failed) and search |
| Settings | Ustawienia | Placeholder — "Functionality will be added soon" |
| Help | Pomoc | Placeholder — "Functionality will be added soon" |

The hard rule: tab views are never rendered as siblings of `<main>`. Each view is a single React component returned from `ActiveTabContent` based on the `nav` state.

## Tests

```bash
NODE_OPTIONS='--experimental-vm-modules' node node_modules/.bin/jest
```

Currently 8/8 unit tests pass for `workflowRegistry` (covers all 6 workflows: `develop_idea`, `critique_idea`, `premortem`, `compare_variants`, `decision_memo`, `full_analysis`).

## API

- `GET  /health` — liveness check
- `GET  /api/providers` — list AI providers
- `GET  /api/agents` — list agents
- `GET  /api/workflows` — list workflows
- `GET  /api/rate-limit` — current rate limit status (remaining requests)
- `POST /api/forge/runs` — create a run (body: `{workflowType, idea, context?, constraints?}`)
- `GET  /api/forge/runs` — list all runs
- `GET  /api/forge/runs/:runId` — run status
- `DELETE /api/forge/runs/:runId` — delete a run
- `POST /api/forge/runs/:runId/cancel` — cancel a running run
- `GET  /api/forge/runs/:runId/events` — SSE event stream
- `GET  /api/forge/runs/:runId/artifacts/decision-memo` — DECISION_MEMO.md artifact

## Workflows

| ID | Name | Agents |
|---|---|---|
| develop_idea | Develop idea | generator → editor → decider |
| critique_idea | Critique idea | skeptic → pragmatist → editor → decider |
| premortem | Pre-mortem | redteam → skeptic → pragmatist → editor → decider |
| compare_variants | Compare variants | generator → pragmatist → skeptic → editor → decider |
| decision_memo | Quick Recommendation | pragmatist → editor → decider |
| full_analysis | Full Analysis | generator → skeptic → pragmatist → redteam → editor → decider |

## Internationalization

The UI supports three languages: **English**, **Deutsch**, and **Polski**. The language selector is in the header. Language preference is persisted in localStorage and defaults to the browser's detected language (fallback: Polski).

All UI strings are externalized in `frontend/src/i18n/{en,de,pl}.json` (~170 keys each). To add a new string:

1. Add the key to all three JSON files
2. Use `t('your.key')` in the component — see `useI18n` in `frontend/src/i18n/I18nProvider.jsx`

## Rate Limits

The demo is protected against token burn-out from accidental usage:

- **Per IP**: max 10 requests / hour
- **Per IP**: max 100 requests / day
- **Per session**: 1 active pipeline at a time (30s cooldown)
- **UI notice**: remaining requests shown in the header
- 429 responses show a blocked UI; `GET /api/rate-limit` returns `{hourlyRemaining, dailyRemaining, hourlyLimit, dailyLimit}`

## Design Reference

The OpenDesign artifact at `design-reference/od-artifact.html` is a single-page vanilla HTML/CSS/JS prototype of the UI — the original visual reference for the React/JSX rewrite. The accompanying `design-reference/README.md` documents the `.view.active` CSS toggle pattern that the React version replaces with conditional rendering (single `nav` state + `ActiveTabContent` switch). The fix to CSS specificity in the artifact is kept as a regression guard for any future vanilla variant.

The monochrome dark theme uses shadcn-style design tokens (HSL channels in `:root` consumed by Tailwind utilities like `bg-background`, `text-foreground`, `border-border`). See `frontend/src/index.css` for the full token set.

## Documentation

- `docs/ARCHITECTURE.md` — system architecture
- `docs/API.md` — API reference
- `docs/LOCAL_SETUP.md` — setup instructions
- `docs/RUNBOOK.md` — operational procedures
- `docs/PRODUCT_SCOPE.md` — product scope
- `design-reference/README.md` — OpenDesign artifact description

## Related

- **Privacy-First AI Portfolio**: https://github.com/RadoslawPleskot/privacy-first-ai-portfolio
- **AI Idea Forge**: https://github.com/Lord-Kedaar/ai-idea-forge