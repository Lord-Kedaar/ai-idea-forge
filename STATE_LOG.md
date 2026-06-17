# AI Idea Forge — STATE LOG

## 2026-06-15 — UI spec refactor (Metricus)

- **Spec:** `~/Downloads/AI_Idea_Forge_UI_Spec_with_reference.md`
- **Status:** COMPLETE — wszystkie 18 kryteriów akceptacji spełnione
- **Nowe pliki frontend:**
  - `frontend/src/theme.css` (12.6 KB) — dark theme, zmienne CSS
  - `frontend/src/api.js` (6.2 KB) — REST + SSE + polling fallback + dev data fallback
  - `frontend/src/markdown.js` (2.1 KB) — XSS-safe renderer
  - `frontend/src/App.jsx` (29.7 KB, 839 linii) — cały UI inline
- **Usunięte:** `components/IdeaInput.jsx`, `WorkflowSelect.jsx`, `RunProgress.jsx`, `AgentOutputList.jsx`, `DecisionMemoView.jsx`
- **Backend changes:**
  - `routes/forgeRuns.js`: dodane `listForgeRuns`, `deleteForgeRun`
  - `storage/runStorage.js`: dodane `listRuns()`, `deleteRun()`, `getStorageDir()`
  - `createApp.js`: 2 nowe route'y (GET list + DELETE)
- **Endpoints dodane:**
  - `GET /api/forge/runs` — list runs (returns 6 z dysku)
  - `DELETE /api/forge/runs/:id` — usuwanie
- **Build:** 168KB JS + 10KB CSS (gzip 53KB + 2.5KB)
- **Testowane:** POST run (201), GET list (200), DELETE (200), Vite build (0 errors)
- **CHANGELOG:** dodany wpis [0.2.0] 2026-06-15

## 2026-06-14 — Build Session (Metricus)

### Decyzje architektoniczne

1. **Provider = fake domyślnie** — `.env`: `DEFAULT_PROVIDER=fake`. Dla realnego LLM: `DEFAULT_PROVIDER=omlx` + `OMLX_BASE_URL=http://<mac-ip>:11434`.
2. **Sekwencyjny pipeline** — agenci wykonują się po kolei, nie równolegle. Każdy agent ma własny timeout (120s domyślnie).
3. **Filesystem storage** — runs zapisane w `./data/runs/<runId>/run.json` + `agent-outputs.json` + `DECISION_MEMO.md`.
4. **ESM modules** — Node 22 ESM, bez Babel. Testy z `NODE_OPTIONS='--experimental-vm-modules'`.
5. **SSE przez Express** — `/api/forge/runs/:runId/events` streamuje eventy. Heartbeat co 15s.

### Struktura projektu

```
backend/src/
  agents/        — agentDefinitions.js, agentRegistry.js, prompts/
  artifacts/      — decisionMemoBuilder.js
  config/        — defaults.js, env.js
  orchestration/ — runEngine.js, runState.js, runEvents.js
  providers/      — fakeProvider.js, omlxProvider.js, providerRegistry.js
  routes/        — health, providers, agents, workflows, forgeRuns, artifacts
  storage/       — runStorage.js
  transports/    — sseTransport.js
  utils/         — errors.js, ids.js, textGuards.js, timeouts.js
  createApp.js, server.js

frontend/src/
  App.jsx, main.jsx, api.js, markdown.js, theme.css
  components/    — (usunięte, zastąpione inline w App.jsx)
```

### Pliki napisane od nowa vs. subagent

- `config/defaults.js`, `config/env.js` — napisane od nowa (subagent miał buggy kod)
- `routes/health.js`, `routes/providers.js`, `routes/agents.js`, `routes/workflows.js` — napisane od nowa
- `routes/forgeRuns.js` — kompletny rewrite z executeRun integration
- `utils/ids.js`, `utils/errors.js`, `utils/textGuards.js`, `utils/timeouts.js` — napisane od nowa
- `orchestration/runEngine.js`, `runState.js`, `runEvents.js` — napisane od nowa
- `artifacts/decisionMemoBuilder.js` — napisane od nowa
- `storage/runStorage.js` — napisane od nowa

### Znane problemy / ograniczenia

- **oMLX na Lenovo niedostępny** — backend na Lenovo nie ma oMLX. Fake provider działa offline.
- **Frontend dynamic import** — `api.js` jest dynamic import w IdeaInput, static w RunProgress (warning przy buildzie, nie błąd).
- **13/13 tests pass** — unit tests gotowe. Smoke test z prawdziwym oMLX nie był uruchomiony.
- **No git commit** — projekt nie jest zacommitowany.

### Następne kroki

1. Uruchomić frontend dev server: `cd frontend && npm run dev`
2. Skonfigurować oMLX na Macu i ustawić `OMLX_BASE_URL` w `.env` na Lenovo
3. Zrobić `git init && git add . && git commit -m "initial"`
4. Uruchomić smoke test z prawdziwym LLM
5. Potwierdzić u użytkownika że UI działa end-to-end

## 2026-06-17 — Stan bieżący (Hermes audit)

### System status
- **Backend:** działa na porcie 3210 (PID 765150)
- **Frontend dev:** działa na porcie 5173 (PID 754922)
- **Frontend preview:** działa na porcie 4173 (PID 368935)
- **Provider aktywny:**  → 
- **Model:**  (faktyczny model z Mac Studio)

### Runs na dysku
- **13 runów** w 
- Ostatni:  (2026-06-15 22:16) — Chcę kupić ogródek działkowy na kredyt
  - Wszystkie 6 agentów zakończonych sukcesem
  - Decision Memo wygenerowany (pełny, 14 sekcji)
  - **BUG:**  +  pomimo kompletnego przebiegu
  - Decydent wydał NO-GO: NIE KONTYNUOWAĆ zakupu ogródka działkowego na kredyt

### Znane problemy
1. **Run status bug** —  nie aktualizuje  →  po zakończeniu ostatniego agenta. Wymaga fix w .
2. **Brak git commit** — cały projekt niezacommitowany od początku
3. **DecisionMemo builder** — czasem zapisuje surowe outputy agentów zamiast parsowanego Markdown (widać w run  — sekcje Analiza słabych punktów... nie są parsowane)

### Co działa
- Provider abstraction (fake/omlx/freellmapi)
- 6-agent pipeline sekwencyjny
- SSE streaming
- REST API: POST/GET/DELETE runs
- Filesystem storage
- Frontend UI kompletny (839 linii App.jsx)

### Następne kroki (priorytet)
1. [BUG] Fix  — ustawiać  +  po Decidencie
2. [BUG] Fix  — poprawne parsowanie sekcji z surowego outputu
3. [GIT] Pierwszy commit
4. [TEST] Uruchomić nowy run i zweryfikować pełny flow end-to-end

## 2026-06-17 — Stan bieżący (Hermes audit)

### System status
- **Backend:** działa na porcie 3210 (PID 765150)
- **Frontend dev:** działa na porcie 5173 (PID 754922)
- **Frontend preview:** działa na porcie 4173 (PID 368935)
- **Provider aktywny:** freellmapi (https://mac-studio.tailc245b7.ts.net:3001)
- **Model:** cogito-2.1:671b (faktyczny model z Mac Studio)

### Runs na dysku
- **13 runów** w ./data/runs/
- Ostatni: 806a8c37f14cb963e3f07e98 (2026-06-15 22:16) — "Chce kupić ogródek działkowy na kredyt"
  - Wszystkie 6 agentów zakończonych sukcesem
  - Decision Memo wygenerowany (pełny, 14 sekcji)
  - **BUG:** status: running + completedAt: null pomimo kompletnego przebiegu
  - Decydent wydał NO-GO

### Znane problemy
1. **Run status bug** — runEngine.js nie aktualizuje status po Decidencie
2. **Brak git commit** — cały projekt niezacommitowany
3. **DecisionMemo builder** — czasem zapisuje surowe outputy zamiast parsowanego Markdown

### Co działa
- Provider abstraction (fake/omlx/freellmapi)
- 6-agent pipeline sekwencyjny
- SSE streaming
- REST API: POST/GET/DELETE runs
- Filesystem storage
- Frontend UI kompletny (839 linii App.jsx)

### Następne kroki (priorytet)
1. [BUG] Fix runEngine.js — status: completed + completedAt po Decidencie
2. [BUG] Fix decisionMemoBuilder.js — parsowanie sekcji
3. [GIT] Pierwszy commit
4. [TEST] Uruchomić nowy run end-to-end
