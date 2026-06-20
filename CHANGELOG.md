# Changelog — AI Idea Forge

## [Unreleased]


### Added
- **Light mode z działającym theme toggle** — `frontend/src/index.css` + nowy `frontend/src/useTheme.js` + `frontend/src/components/ThemeToggle.jsx`:
  - Tokeny CSS dla `:root[data-theme='light']` (identyczne z OpenDesign — białe tło, ciemny tekst, secondary 95.9%, border 90%).
  - Hook `useTheme()` ustawia `data-theme` na `<html>`, persystuje w `localStorage('forge-theme')`, fallback do `prefers-color-scheme` tylko przy pierwszej wizycie (po zapisie OS przestaje nadpisywać wybór użytkownika).
  - `ThemeToggle` w HeaderBar — ikona `Moon`/`Sun` z lucide, `aria-pressed`, `aria-label='Przełącz motyw'`.
  - Body transition 200ms dla `background-color` i `color` przy zmianie motywu.
- **Sidebar brand z logo SVG** — `frontend/src/components/SidebarNav.jsx`:
  - Dwa `<img>` (`icon_dark_theme.svg`, `icon_light_theme.svg`) z atrybutami `data-theme-icon='dark'/'light'`. CSS przełącza widoczność przez `:root[data-theme='light']` — użytkownik zawsze widzi kontrastujące logo.
  - Tytuł `Idea Forge` + podtytuł `AI walidacja pomysłów` (klucz `brandSub`).
  - Ikony `icon_dark_theme.svg` / `icon_light_theme.svg` / `favicon.png` skopiowane z `/home/radek/ai-idea-forge/icons/` do `frontend/public/icons/` — wcześniej Vite zwracał SPA fallback (`text/html` mimo HTTP 200) zamiast assetu.
- **Sidebar footer (OD parity)** — `frontend/src/components/SidebarNav.jsx`:
  - Pozycje `Ustawienia` + `Pomoc` w sekcji footer (nie w głównej nawigacji).
  - Separator `separator`, linki `Prywatność` + `Opis projektu` + copyright `© 2026 Radosław Pleskot`.
- **Breadcrumb w topbarze** — `frontend/src/components/HeaderBar.jsx`:
  - Wzorzec `Warsztat / <aktywna zakładka>` — `bc.workspace` + `bc.idea/analysis/memo/history/settings/help`.
  - Śledzi stan `nav` przekazany przez nowy prop `active={nav}`.
- **User chip w topbarze** — `frontend/src/components/HeaderBar.jsx`:
  - Avatar `RP` + imię `Radosław` ukryte < sm, separator pionowy przed chipem.
- **`prefers-reduced-motion`** — `frontend/src/index.css`:
  - Globalny `@media (prefers-reduced-motion: reduce)` obniża `animation-duration` / `transition-duration` / `scroll-behavior` do `0.01ms`.
- **Klucze i18n × 14 × 3 języki** — `frontend/src/i18n/{pl,en,de}.json`:
  - `brandSub`, `nav.workspace`, `nav.library`, `bc.workspace`, `bc.idea`, `bc.analysis`, `bc.memo`, `bc.history`, `bc.settings`, `bc.help`, `footer.privacy`, `footer.about`, `footer.copyright`, `themeToggleLabel`.

### Changed
- **Historia usunięta z widoku `Pomysł`** — `frontend/src/App.jsx`:
  - `IdeaView` renderuje wyłącznie `IdeaInputForm` + `AnalysisExplainer` + (opcjonalnie) `BackendStatus`. `RunsHistoryPanel` pozostaje wyłącznie w `HistoryView`. Warunek `runs.length > 0 && !isMobile` wycofany, zmienna `isMobile` usunięta.
- **Sidebar podzielony na grupy `Warsztat` i `Biblioteka`** — `frontend/src/components/SidebarNav.jsx`:
  - `Warsztat`: `Pomysł`, `Analiza`, `Decision Memo`.
  - `Biblioteka`: `Historia`.
  - Labels z kluczy `nav.workspace` / `nav.library`.
- **Wzmocnione transitions** — `frontend/src/index.css`:
  - `.nav-item`: hover dodaje `translate-x-0.5` + `bg-accent`.
  - `.workflow-card`: hover dodaje `translate-y-px` + `border-foreground/20`.
  - `.theme-toggle`, `.sidebar-link`, `.btn`: `transition-all 150ms` z hover/focus-visible ring.

### Verified
- `vite build` → 1598 modules transformed, dist 239 KB JS + 47.7 KB CSS, 0 errors.
- `jest` → 25/25 backend tests pass (workflowRegistry, agentRegistry, runState, providers, …).
- `/health` → 200 OK.
- `/api/workflows` → 6 workflows (develop_idea, critique_idea, premortem, compare_variants, decision_memo, full_analysis) z poprawnymi agentami.
- `POST /api/forge/runs` (decision_memo, fake provider) → 200 + `runId`.
- `dist/assets/*.js` grep `nav.templates`/`nav.agents`/`Szablony`/`Agenci` → 0 (Radosław celowo usunął te zakładki).
- `dist/assets/*.js` grep `nav.workspace`/`brandSub`/`footer.privacy`/`themeToggleLabel`/`bc.*` → 9 wystąpień.
- `dist/assets/*.css` grep `data-theme=light` → 1 (light theme tokeny).
- `dist/assets/*.css` grep `prefers-reduced-motion` → 1.
- `dist/assets/*.css` grep `[data-theme-icon=dark]` + `[data-theme-icon=light]` + light overrides → 4 selektory.
- `GET /icons/icon_dark_theme.svg` → `200 Content-Length: 587` (real bytes).

### Risks
- camofox-browser na Macu zwrócił HTTP 500 z `/tabs` — screenshoty wizualne pominięte (poza scope, znany problem ze skill).
- `frontend/src/i18n/*.js` (pl/en/de) to martwe duplikaty `.json` — nie są importowane przez `I18nProvider.jsx`. Poza scope tej sesji.
- Mobile drawer (slide-in + ESC + scrim) — OD ma, React ma tylko `hidden md:flex`. Pominięte jako duży refaktor poza minimalnym zakresem naprawy.
- Topbar "Skróty klawiszowe" button (placeholder w OD) — pominięty, brak zdefiniowanej funkcji.
### Fixed
- **Layout zakładek — tylko jeden aktywny widok w głównym panelu** — `frontend/src/App.jsx`:
  - Poprzednio widoki `AnalysisProgress`, `DecisionMemoPanel`, `RunsHistoryPanel` (top-5) były renderowane jako rodzeństwo `<main>` lub pod `IdeaInputForm`, niezależnie od wybranej zakładki w sidebarze. Wynik: po kliknięciu "Pomysł" pod formularzem pojawiały się sekcje "Analiza", "Decision Memo", "Historia analiz" w jednym flow.
  - Teraz `<main>` renderuje wyłącznie jedną aktywną zakładkę przez `ActiveTabContent` switch na `nav`. Nowa funkcja `openRun(runId)` kieruje do `nav='memo'` (gdy ukończony) lub `nav='analysis'` (gdy w toku / błąd). `handleStart()` po utworzeniu runu ustawia `nav='analysis'`.
  - 6 dedykowanych widoków: `IdeaView`, `AnalysisView`, `DecisionMemoView`, `HistoryView`, `SettingsView` (placeholder), `HelpView` (placeholder).
- **`analysis` i `memo` jako realne zakładki** — `frontend/src/components/SidebarNav.jsx`:
  - Sidebar miał tylko pozycje `idea` i `history` działające; kliknięcie `templates`, `agents`, `settings`, `help` nie zmieniało widoku. Dodane pozycje `analysis` (ikona `Activity`) i `memo` (ikona `FileText`).
- **`Pomysł` nie pokazuje już memo i analysis pod formularzem** — zgodnie z briefem Radosława i `FIX_TAB_CONTENT_RENDERING_MAIN_VIEW.md`: tylko jeden widok aktywny naraz. `IdeaView` zawiera tylko `IdeaInputForm` + `AnalysisExplainer` + top-5 `RunsHistoryPanel` + `BackendStatus` (gdy down).

### Removed
- **Zakładka `Szablony` usunięta** — `frontend/src/components/SidebarNav.jsx` + klucze `nav.templates` × 3 pliki i18n.
- **Zakładka `Agenci` usunięta** — ta sama lista; zakładka nie miała widoku, endpointu ani treści.
- **Backupy z developer's working tree** — `frontend/src/App.jsx.backup-*` (4 pliki), `frontend/src/theme.css.bak-monochrome-20260620`, `backend/src/artifacts/decisionMemoBuilder.js.backup-20260617-155627`. `.gitignore` rozszerzony o `*.backup-*`, `*.bak-*`, `*.bak`.

### Added
- **`frontend/src/components/PlaceholderView.jsx`** — generyczna karta "Wkrótce" dla `Settings` i `Help`. Tekst placeholdera z i18n (`placeholder.comingSoon`).
- **Klucze i18n** — `frontend/src/i18n/{pl,en,de}.json`:
  - dodane: `nav.analysis`, `nav.memo`, `placeholder.comingSoon`, `placeholder.settingsTitle`, `placeholder.helpTitle`
  - usunięte: `nav.templates`, `nav.agents`

### Tested
- `vite build` — 1596 modules transformed, 0 errors, dist 234KB JS + 43KB CSS
- Vite dev server (5173) — `--force` re-optimization, serwuje nowy JSX (curl `src/App.jsx` zawiera `PlaceholderView`, `ActiveTabContent`, wszystkie 6 case'ów switcha)
- Bundle dist nie zawiera kluczy `nav.templates` / `nav.agents` (grep = 0)
- Bundle dist zawiera klucze `nav.analysis` / `nav.memo` / `placeholder.comingSoon` (grep = 4)
- Backend (3210) — `/health` = 200 OK
- 8/8 backend tests (workflowRegistry.test.js) — pass

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