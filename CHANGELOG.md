# Changelog — AI Idea Forge

## [Unreleased]

### Fixed
- **Bug A — priorOutputs field mismatch (krytyczny)** — `backend/src/orchestration/runState.js`:
  - `getPriorOutputs()` zwracało `{ agent, content }` ale szablon promptu czytał `o.output`
  - skutek: agenci 2+ w pipeline otrzymywali `undefined` zamiast realnych outputów poprzednich agentów
  - naprawione: `content` → `output` w mapowaniu
- **Testy integracyjne priorOutputs** — `backend/tests/unit/priorOutputs.test.js` (nowy):
  - test regresji `getPriorOutputs` field name
  - test integracyjny pełnego promptu z `priorOutputs`
  - test weryfikujący brak duplikatów Reference topic w pierwszym agencie
  - 8 testów, wszystkie przechodzą

### Added
- **Decision Memo export do PDF** — `frontend/src/components/DecisionMemoPanel.jsx` + `frontend/src/i18n/{pl,en,de}.json`:
  - Usunięty przycisk **Podgląd artefaktu**.
  - Przycisk **Drukuj / zapisz jako PDF** zmieniony na **Zapisz jako PDF** (PL/EN/DE).
  - Eksport przez ukryty `iframe` z `window.print()` — bez popup preview, bez zewnętrznych zależności.
- **Actionbar poza formularzem** — `frontend/src/components/IdeaActionBar.jsx` (nowy) + `frontend/src/App.jsx`:
  - Wydzielony komponent z `shrink-0 border-t border-border bg-background` — pełna szerokość, anchor bottom.
  - Duplikat labela `Idea / Problem / Decyzja` usunięty z `card-header` formularza.

### Changed
- **Hierarchia borderów** — `frontend/src/index.css`:
  - Nowe tokeny `--border-strong` (dark: 240 3.7% 23%, light: 240 5.9% 78%).
  - Główne granice layoutu (`header.border-b`, `aside.border-r`) używają `--border-strong`.
- **Sidebar brand z logo SVG** — `frontend/src/components/SidebarNav.jsx`:
  - Dwa obrazy SVG z `data-theme-icon` przełączane przez CSS.
  - Tytuł `Idea Forge` + podtytuł `AI walidacja pomysłów`.
- **Sidebar podzielony na grupy** — `Warsztat` (Pomysł, Analiza, Decision Memo) + `Biblioteka` (Historia).
- **Light mode z theme toggle** — `frontend/src/index.css` + `useTheme.js` + `ThemeToggle.jsx`.
- **Breadcrumb + User chip w topbarze** — `frontend/src/components/HeaderBar.jsx`.
- **`prefers-reduced-motion`** — globalny `@media` w `index.css`.

### Removed
- **Zakładki `Szablony` i `Agenci`** — usunięte z SidebarNav + i18n keys.
- **Martwe klasy `.actionbar*` w `index.css`** — po migracji do Tailwind.
- **Klasy `.backup-*` i `.bak-*`** — rozszerzony `.gitignore`.

### Verified
- `npm test` → **33/33 tests pass** (6 suites).
- `vite build` → 0 errors, dist 242.82 KB JS + 47.81 KB CSS.
- `/health` → 200 OK · `/api/workflows` → 6 workflows.


## [0.4.0] — 2026-06-17

### Added
- **Hermes audit** — pełna inwentaryzacja stanu projektu

### Known Issues (now documented)
- **Run status bug** — run pozostaje w statusie "running" po zakończeniu wszystkich agentów. Fix wymagany w `orchestration/runEngine.js` w metodzie `completeRun()`.
- **DecisionMemo builder** — surowe outputy agentów nie są parsowane na sekcje Markdown. Wymaga fix w `artifacts/decisionMemoBuilder.js`.
- **Brak git commit** — cały projekt nigdy nie był zacommitowany

### Verified Working
- Backend działa na porcie 3210 (Node process active)
- Frontend dev działa na porcie 5173, preview na 4173
- FreeLLMApi provider aktywny, model cogito-2.1:671b przez Mac Studio
- 13 historycznych runów na dysku
- Ostatni run (806a8c...) — pełny przebieg 6 agentów z Decision Memo

### Next Steps
1. Fix run status tracking (runEngine.js)
2. Fix DecisionMemo parsing (decisionMemoBuilder.js)  
3. Pierwszy git commit
4. End-to-end test z nowym runem

## [0.3.0] — 2026-06-15

### Added
- **FreeLLMApi provider** — trzeci provider w abstrakcji
  - `backend/src/providers/freeLLMApiProvider.js` (3.5 KB) — OpenAI-compatible
  - Endpoint: `${FREELLMAPI_BASE_URL}/v1/chat/completions`
  - `FREELLMAPI_MODEL=auto` — serwer wybiera model automatycznie
  - Wymaga `FREELLMAPI_API_KEY`
- **Provider-agnostic architektura** — `createApp.js` ma `buildProviderConfig()` mapujący env per provider; `providerRegistry` wciąż trzyma fabrykę
- **Run metadata** — każdy run przechowuje `provider`, `requestedModel`, `actualModel`
  - `actualModel` ustawiany z odpowiedzi providera (przydatny przy `model=auto`)
  - `toJSON()` eksportuje te pola, GET `/api/forge/runs/:id` je zwraca
- **UI: Product Explainer** — prawa kolumna PRZED startem pokazuje:
  - Panel "Jak działa analiza?" z 6 agentami (Generator, Sceptyk, Pragmatyk, Red Team, Redaktor, Decydent)
  - Placeholder "Decision Memo" z szablonem 14 sekcji (# Problem, Propozycja, Kontekst, Fakty, Założenia, Argumenty za, Argumenty przeciw, Ukryte ryzyka, Pytania otwarte, Alternatywy, Minimalny eksperyment, Rekomendacja, Status, Następny krok)
  - **UI: Backend Diagnostics** — panel "Backend niedostępny" z diagnostyką + retry button
  - **UI: "Moje runy" przesunięte** do secondary section (pod głównym flow)
  - **UI: Provider metadata w run** — kolumna "Provider / Model" w tabeli i w StatusCard
  - **UI: Header diagnostics** — badge "Backend: down" z tooltip + Retry button
- **API: `/api/providers` rozszerzony** — zwraca listę wszystkich providerów z metadanymi (baseUrl, defaultModel, isActive)

### Changed
- `config/defaults.js` — `provider.name: 'freellmapi'` (aktualny provider roboczy)
- `config/env.js` — dodane env vars: `FREELLMAPI_BASE_URL`, `FREELLMAPI_API_KEY`, `FREELLMAPI_MODEL`
- `providerRegistry` — teraz zawiera 3 providery: fake, omlx, freellmapi
- `runEngine.js` — przechwytuje `result.model` z providera i przekazuje do `completeAgent(agentId, content, { model })`
- `routes/providers.js` — pełny redesign: lista z `PROVIDER_META` (name, description), per-provider baseUrl + defaultModel
- `routes/forgeRuns.js` — `executeRun` przekazuje `provider` i `requestedModel` do RunState
- Frontend build: 168KB → 173KB JS + 11KB CSS (gzip 55KB + 2.75KB)

### Tested
- 20/20 unit tests pass (4 nowych dla RunState metadata)
- `GET /api/providers` → 3 providery (fake/omlx/freellmapi) z metadanymi
- POST run + GET run → zwraca `provider`, `requestedModel`, `actualModel` w state
- Run z fake provider: `actualModel=fake-model` zapisane
- Vite build: 30 modułów transformed, 0 errors

## [0.2.0] — 2026-06-15

### Added
- **UI spec refactor** — pełny nowy frontend zgodny z `AI_Idea_Forge_UI_Spec_with_reference.md`
  - 2-kolumnowy layout (responsive < 900px → 1 kolumna)
  - Header z nazwą, tagline "Pomysł → Krytyka → Ryzyka → Rekomendacja", badges (Backend/Provider/Model/MVP/Local)
  - Sekcja "Nowy run": Idea textarea (5000 znaków, licznik, walidacja), 5 kafelków trybu pracy, Kontekst, Ograniczenia, Dodatkowe opcje (collapsible: długość/krytyka/priorytet/instrukcje), info panel
  - Sekcja "Status analizy" z live tickerem czasu, status pill, Run ID, aktualny agent
  - Sekcja "Postęp" — lista ○/●/✓/! dla każdego etapu + Decision Memo
  - Sekcja "Praca agentów" — accordion cards z outputem per agent
  - Sekcja "Artefakty" — Decision Memo (aktywny) + 5 wkrótce
  - Sekcja "Decision Memo" — Markdown preview (custom renderer, XSS-safe), Kopiuj Markdown, Pobierz .md, Otwórz w nowej karcie
  - Sekcja "Moje runy" — tabela z filtrami (Wszystkie/Zakończone/W toku/Błąd), search, akcje Otwórz/Memo
  - Stany: idle/running/completed/failed/validation/error
  - SSE + polling fallback (`subscribeRunWithFallback` w api.js)
  - Dark theme CSS (12.6KB, zmienne CSS, mobile responsive)
- **API**: `GET /api/forge/runs` — list wszystkich runów z filesystem
- **API**: `DELETE /api/forge/runs/:runId` — usuwanie runu (na przyszłość)
- **Storage**: `listRuns()` czyta wszystkie katalogi runów, sortuje po createdAt desc
- **Storage**: `deleteRun(runId)` rm -rf katalogu runu
- **Router**: dodane handlery dla listForgeRuns, deleteForgeRun w forgeRuns.js
- **Markdown renderer** (frontend) — bezpieczny parser #/##/###, listy, **bold**, *italic*, `code`

### Changed
- Frontend build: 149KB → 168KB JS + 10KB CSS (Vite)
- App.jsx zastąpił stary zestaw komponentów (IdeaInput, RunProgress, WorkflowSelect, AgentOutputList, DecisionMemoView) — wszystko inline w jednym pliku (839 linii)
- createApp.js: dodane 2 nowe route'y (GET list + DELETE)

### Tested
- POST /api/forge/runs → 201 z runId ✅
- GET /api/forge/runs → zwraca 6 historycznych runów ✅
- DELETE /api/forge/runs/:id → 200 OK ✅
- Vite build: 30 modułów transformed, 0 errors ✅
- Backend + frontend nasłuchują, SSH tunnel działa

## [0.1.0] — 2026-06-14

### Added
- Backend Express.js z modularną architekturą ESM
- Provider abstraction: `FakeProvider` (offline), `OmlxProvider` (Ollama-compatible API)
- 6 agentów: generator, skeptic, pragmatist, redteam, editor, decider
- 5 workflow definitions: develop_idea, critique_idea, premortem, compare_variants, decision_memo
- Sekwencyjny orchestration pipeline z timeoutami i AbortController
- Filesystem-based run storage (`./data/runs/<runId>/`)
- SSE event streaming (`/api/forge/runs/:runId/events`)
- `DECISION_MEMO.md` artifact builder z auto-ekstrakcją sekcji
- REST API: POST/GET `/api/forge/runs`, GET `/api/forge/runs/:runId/artifacts/decision-memo`
- REST API: GET `/api/providers`, `/api/agents`, `/api/workflows`
- Unit tests (13/13 passing): ProviderRegistry, AgentRegistry, WorkflowRegistry, DecisionMemoBuilder
- Minimal React frontend (Vite build: 149KB bundle)
- Documentation: ARCHITECTURE.md, API.md, LOCAL_SETUP.md, PRODUCT_SCOPE.md, PROVIDER_ABSTRACTION.md, RUNBOOK.md, STUDIO_MODE_FLOW.md
- `.env` z `DEFAULT_PROVIDER=fake` (offline mode)
- Vite proxy: frontend :5173 → backend :3210

### Known Issues
- oMLX nie skonfigurowany na Lenovo; używaj `DEFAULT_PROVIDER=fake` do testów offline
- Frontend wymaga potwierdzenia użytkownika (UI nie było ręcznie testowane)
- Brak git commit