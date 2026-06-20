# AI Idea Forge — STATE LOG

## 2026-06-20 — Layout fix + sidebar cleanup (Metricus)

### Kontekst
OpenDesign zostawił w `/home/radek/ai-idea-forge/design-reference/` artefakt HTML (single-page CSS toggle prototype: 6 view-ów: idea / analysis / memo / history / templates / agents) + README z opisem mechanizmu `.view.active`. Mechanizm CSS jest w Reakcie bezpośrednio zastępowany przez `nav` state — bez klas `display:none/flex`. Layout fix dotyczył przeniesienia renderingu widoków do `<main>` swap-style zamiast sąsiadującego renderu w jednym flow.

### Pliki zmienione
- `frontend/src/App.jsx` — pełny refactor routingu zakładek:
  - Dodane 5 wewnętrznych widoków: `IdeaView`, `AnalysisView`, `DecisionMemoView`, `HistoryView`, `ActiveTabContent`
  - `PlaceholderView` użyty dla `Settings` i `Help` (komponent w `frontend/src/components/PlaceholderView.jsx`)
  - `openRun(runId)` zmienia `nav` na `'memo'` (completed) lub `'analysis'` (running/failed) — poprzednio zawsze `'idea'`
  - `handleStart()` po utworzeniu runu ustawia `nav='analysis'` — poprzednio zostawiał domyślne `'idea'`
  - `handleNewRun()` ustawia `nav='idea'` (czyszczenie stanu + przekierowanie do formularza)
  - Usunięte sąsiadujące renderowanie `DecisionMemoPanel` i `AnalysisProgress` pod `IdeaInputForm` — teraz tylko w dedykowanych zakładkach
- `frontend/src/components/SidebarNav.jsx`:
  - Usunięte pozycje `templates` i `agents`
  - Dodane pozycje `analysis` (ikona `Activity`) i `memo` (ikona `FileText`)
  - Zachowane: `idea`, `history`, `settings`, `help`
- `frontend/src/components/PlaceholderView.jsx` — nowy komponent (970 bajtów):
  - Generyczna karta "Wkrótce" dla `Settings` i `Help`
  - Tekst z i18n: `placeholder.comingSoon` (PL/EN/DE)
  - Tytuł z i18n: `placeholder.settingsTitle` / `placeholder.helpTitle`
- `frontend/src/i18n/{pl,en,de}.json`:
  - Dodane klucze: `nav.analysis`, `nav.memo`, `placeholder.comingSoon`, `placeholder.settingsTitle`, `placeholder.helpTitle`
  - Usunięte klucze: `nav.templates`, `nav.agents`
- `.gitignore` — dodane `*.backup-*`, `*.bak-*`, `*.bak` (blokada przyszłych backupów)

### Cleanup (przed właściwą zmianą)
- Usunięte z dysku + z indeksu gita (commit `cc0d4dc`):
  - `frontend/src/App.jsx.backup-20260615-220729-before-persist`
  - `frontend/src/App.jsx.backup-20260615-221435-before-persist-v2`
  - `frontend/src/App.jsx.backup-20260615-221710-before-persist-v3`
  - `backend/src/artifacts/decisionMemoBuilder.js.backup-20260617-155627`
- Backup tag ustawiony: `pre-layout-fix-20260620`

### Verify
- `vite build` → 1596 modules transformed, 0 errors, dist 234KB JS + 43KB CSS
- Vite dev server (5173) z `--force` → serwuje nowy JSX
- `curl http://localhost:5173/src/App.jsx` → zawiera `PlaceholderView`, `ActiveTabContent`, wszystkie 6 case'ów switcha na `nav`
- `curl http://localhost:5173/src/i18n/pl.json` → zawiera `nav.analysis`, `nav.memo`, `placeholder.*`; NIE zawiera `nav.templates`, `nav.agents`
- Backend (3210) `/health` → 200 OK
- 8/8 backend tests (workflowRegistry.test.js) → pass
- Dist bundle: `nav.templates` / `nav.agents` grep = 0, `nav.analysis` / `nav.memo` / `placeholder.comingSoon` grep = 4

### Twarde reguły spełnione
- Tylko jeden aktywny widok renderowany naraz (ActiveTabContent switch)
- Analiza / DecisionMemoPanel / RunsHistoryPanel NIE są sąsiadami AppShell ani `<main>`
- `<main>` jest jedynym kontenerem przewijanym dla treści zakładek
- `body` nie jest głównym scroll containerem dashboardu (AppShell ma `flex h-full min-h-screen`)

### Poza scope (świadomie nie ruszane)
- Backend (żadnego pliku `.js` w `backend/`)
- `api.js` (endpointy i ich kontrakt bez zmian)
- `index.css` (OpenDesign monochrome shadcn theme — zostawiam do osobnej decyzji)
- `tailwind.config.js`, `postcss.config.js` (nowe pliki OpenDesign — zostawiam)
- `DESIGN.md`, `OPENDESIGN_*`, `AI_IDEA_FORGE_*` (design docs)
- Komponenty `IdeaInputForm`, `AnalysisProgress`, `DecisionMemoPanel`, `RunsHistoryPanel`, `AnalysisExplainer`, `BackendStatus` — używane bez zmian

### Ryzyka
- HMR cache wyczyszczony + restart z `--force` (per Vite HMR force-cache pitfall)
- Push na remote wymaga GitHub auth — klucz `id_ed25519` zweryfikowany (`Hi Lord-Kedaar! You've successfully authenticated`)

## 2026-06-15 — UI spec refactor (Metricus)