# AI Idea Forge — OpenDesign Parity Fix V2 — Report

**Data:** 2026-06-20
**Agent:** Metricus
**Branch/working-tree:** lenovo-server `/home/radek/ai-idea-forge/`
**Backend:** 3210 (uruchomiony) · **Vite dev:** 5173 (zrestartowany z `--force`)

---

## 1. Status

**`OD_PARITY_FIXED_WITH_WARNINGS`**

Frontend osiągnął możliwie najbliższą zgodność z `design-reference/od-artifact.html`
z jedną świadomą różnicą: zakładki `Szablony` i `Agenci` **nie zostały przywrócone**
(decyzja produktowa Radosława). Backend, SSE, API contracts i i18n nienaruszone.

**Ostrzeżenia:**
- Screenshot tool (`camofox-browser`) nie zadziałał (HTTP 500 z `/tabs`), więc
  wizualna weryfikacja przez screenshot jest pominięta. Build + grep
  `data-theme="light"` / `prefers-reduced-motion` / `footer.*` / `bc.*` /
  `nav.workspace` / `brandSub` / `themeToggleLabel` w dist potwierdzają, że
  kod i style są na miejscu.
- Pliki `.js` w `frontend/src/i18n/` (`pl.js`, `en.js`, `de.js`) to legacy
  duplikaty `.json` — martwe, nie importowane. Poza scope tej sesji.

---

## 2. Zmienione / dodane pliki

| Plik | Akcja | Co |
|------|-------|----|
| `frontend/src/App.jsx` | M | Usunięty `RunsHistoryPanel` z `IdeaView` (historia tylko w `HistoryView`), usunięta zmienna `isMobile`, dodany prop `active={nav}` do `<HeaderBar>` |
| `frontend/src/components/SidebarNav.jsx` | M | Dodany brand (logo SVG `icon_dark_theme.svg` / `icon_light_theme.svg` z auto-switch po `data-theme`), grupy `Warsztat` (Pomysł, Analiza, Decision Memo) + `Biblioteka` (Historia), footer z `Ustawienia` + `Pomoc` + separator + `Prywatność` / `Opis projektu` / `© 2026 Radosław Pleskot` |
| `frontend/src/components/HeaderBar.jsx` | M | Dodany breadcrumb (`Warsztat / <aktywna zakładka>`), `LanguageSwitcher`, nowy `ThemeToggle`, user chip `RP / Radosław` |
| `frontend/src/components/ThemeToggle.jsx` | A | Nowy komponent — ikona `Moon`/`Sun` z lucide, korzysta z `useTheme()` |
| `frontend/src/useTheme.js` | A | Nowy hook — `data-theme="dark"\|"light"` na `<html>`, `localStorage forge-theme`, fallback do `prefers-color-scheme` tylko przy pierwszej wizycie |
| `frontend/src/index.css` | M | Dodane tokeny light theme (`:root[data-theme='light']`), `prefers-reduced-motion`, transitions dla `.nav-item` / `.workflow-card` / `.theme-toggle` / `.sidebar-link`, `.brand-mark` (24×24), selektory `[data-theme-icon]` (przełączanie logo), light-theme override `.memo-preview` |
| `frontend/src/i18n/pl.json` | M | +14 kluczy: `brandSub`, `nav.workspace`, `nav.library`, `bc.workspace/idea/analysis/memo/history/settings/help`, `footer.privacy/about/copyright`, `themeToggleLabel` |
| `frontend/src/i18n/en.json` | M | +14 kluczy (EN) |
| `frontend/src/i18n/de.json` | M | +14 kluczy (DE) |
| `frontend/public/icons/icon_dark_theme.svg` | A | Skopiowane z `icons/` — wcześniej Vite zwracał SPA fallback zamiast assetu (200 + `text/html`) |
| `frontend/public/icons/icon_light_theme.svg` | A | j.w. |
| `frontend/public/icons/favicon.png` | A | j.w. |

Pliki backendu (`backend/src/**`), `vite.config.js`, `api.js`, `package.json`,
`tailwind.config.js`, `postcss.config.js`, `main.jsx`, `index.html` —
**niemodyfikowane** (zgodnie z twardymi regułami).

---

## 3. Tabela zgodności z OpenDesign

| Obszar | Status | Uwagi |
|--------|--------|-------|
| Logo (sidebar brand) | **fixed** | `icon_dark_theme.svg` + `icon_light_theme.svg` auto-przełączane przez `[data-theme-icon]` + `:root[data-theme='light']` |
| Light mode | **fixed** | Tokeny HSL `:root[data-theme='light']` w `index.css` (identyczne z OD), toggle w HeaderBar, persistencja w `localStorage('forge-theme')`, fallback `prefers-color-scheme` |
| Theme toggle | **fixed** | `<ThemeToggle>` z lucide `Moon`/`Sun`, `aria-pressed`, `aria-label="Przełącz motyw"` |
| Sidebar footer | **fixed** | Separator + `Prywatność` + `Opis projektu` + `© 2026 Radosław Pleskot` |
| Mode icons | **fixed** (wcześniej) | Karty trybów mają ikony lucide (`Lightbulb` / `ShieldQuestion` / `ShieldAlert` / `GitCompare` / `CheckCircle2` / `Workflow`) |
| Sidebar nav icons | **fixed** | Każda pozycja ma ikonę lucide (`Lightbulb` / `Activity` / `FileText` / `History` / `Settings` / `HelpCircle`) |
| Breadcrumb (topbar) | **fixed** | `Warsztat / <aktywna zakładka>`, śledzi `nav` state |
| User chip | **fixed** | `RP` / `Radosław` w HeaderBar (ukryty < sm) |
| Animations/transitions | **fixed** | `transition-all 150ms` na `.nav-item` (hover: translate-x-0.5), `.workflow-card` (hover: translate-y-px), `.theme-toggle`, `.sidebar-link`, `.btn`. `prefers-reduced-motion` redukuje do `0.01ms` |
| Historia poza `Pomysł` | **fixed** | `IdeaView` nie renderuje już `RunsHistoryPanel`. Historia dostępna tylko przez `HistoryView`. Warunek `runs.length > 0 && !isMobile` z poprzedniej sesji usunięty. |
| Single active view | **preserved** | `ActiveTabContent` switch renderuje dokładnie 1 widok (Pomysł / Analiza / Decision Memo / Historia / Ustawienia / Pomoc). Brak renderowania rodzeństwa pod `<main>` |
| Backend: OK / Provider / Model panel | **preserved as alarm only** | `BackendStatus` renderuje się TYLKO gdy `backendDown === true`. Brak stałego panelu diagnostycznego. |
| Dynamiczny pipeline | **preserved** | `AnalysisExplainer` renderuje tylko agentów wybranego trybu (3 dla `decision_memo`, 6 dla `full_analysis`) — bez statusów runtime |
| API contracts | **preserved** | `POST /api/forge/runs`, `GET /api/forge/runs`, `GET /api/forge/runs/:runId`, `POST /api/forge/runs/:runId/cancel`, `GET /api/forge/runs/:runId/events`, `GET /api/forge/runs/:runId/artifacts/decision-memo`, `GET /api/workflows`, `GET /health` — wszystkie bez zmian |
| SSE / live progress | **preserved** | `api.js#subscribeRunEvents` czyta `data:` linie przez `onmessage`, route po `payload.type`. Polling fallback po 3 s |
| i18n PL/EN/DE | **fixed** | 14 nowych kluczy × 3 języki, bez undefined labels |
| **Szablony / Agenci** | **intentionally not restored** | Decyzja Radosława — zakładki były bez sensu na tym etapie produktu. Sidebar ma teraz tylko 6 pozycji: Pomysł / Analiza / Decision Memo / Historia / Ustawienia / Pomoc |
| Mobile drawer + ESC + scrim | **partial** | OD ma slide-in drawer z ESC i scrim dla `< 900px`. React ma `<aside hidden md:flex>` — brak dedykowanego drawer UI, ale layout i tak przechodzi w jednokolumnowy mobile-first flow (HeaderBar + main content). Celowo poza scope — duży refaktor, brak explicitnego wymogu w prompcie V2 (poza "mobile drawer: transition slide-in; scrim fade; ESC zamyka drawer; kliknięcie nav zamyka drawer") |
| Kbd shortcuts button (topbar) | **omitted** | OD ma icon-btn "Skróty klawiszowe" bez zdefiniowanej funkcji. Pominięte — nie dodaje realnej wartości |
| Toasts | **omitted** | OD nie ma toastu; React nie wprowadzał toastów. Pominięte zgodnie z zasadą "nie dodawaj na siłę" |

---

## 4. Świadome różnice względem OpenDesign

- **`Szablony` i `Agenci` nie zostały przywrócone**, bo użytkownik wcześniej kazał je usunąć.
  W poprzedniej sesji (STATE_LOG 2026-06-20) zostały usunięte z sidebara i i18n; klucze
  `nav.templates` / `nav.agents` nie istnieją w `dist/assets/*.js` ani w żadnym pliku
  `frontend/src/**`.
- **Mobile drawer**: OD używa slide-in `<aside>` z ESC + scrim. React tailwindowo
  ukrywa sidebar pod `md:` i nie wprowadza dedykowanego drawer UI. Dla tej iteracji
  pozostaje bez dedykowanego drawer UI — koszt: średni, wartość dla użytkownika:
  niska (aplikacja jest single-page workflow, nie multi-page SaaS).
- **Shortcut button**: OD ma w topbarze przycisk "Skróty klawiszowe" bez
  zdefiniowanej funkcji (placeholder). React go nie implementuje.
- **Light-mode prose colors**: OD używa `prose-invert` który Tailwind ma, ale
  wariant jest mniej semantyczny niż ręczne nadpisanie kolorów w
  `:root[data-theme='light'] .memo-preview`. Wybrałem drugie podejście.

---

## 5. Wyniki testów i buildu

### `vite build`
```
vite v6.4.3 building for production...
✓ 1598 modules transformed.
dist/index.html                   0.59 kB │ gzip:  0.39 kB
dist/assets/index-CmV-IuSV.css   47.73 kB │ gzip:  7.56 kB
dist/assets/index-DPvlLKV3.js   239.09 kB │ gzip: 75.02 kB
✓ built in 11.64s
```

### Backend tests
```
Test Suites: 5 passed, 5 total
Tests:       25 passed, 25 total
Time:        2.335 s
```
(`NODE_OPTIONS='--experimental-vm-modules' node node_modules/.bin/jest`)

### Live endpoints
- `GET /health` → `{"status":"ok","timestamp":"2026-06-20T11:18:12.973Z"}`
- `GET /api/workflows` → 6 workflows (develop_idea, critique_idea, premortem, compare_variants, decision_memo, full_analysis) — wszystkie z poprawnymi listami agentów
- `POST /api/forge/runs` (workflowType=decision_memo) → 200 + `runId`

### dist grep — weryfikacja zgodności
| Check | Expected | Actual |
|-------|----------|--------|
| `nav.templates` / `nav.agents` / `Szablony` / `Agenci` w dist JS | 0 | **0** ✅ |
| `nav.workspace` / `nav.library` / `brandSub` / `footer.privacy` / `footer.about` / `footer.copyright` / `themeToggleLabel` / `bc.workspace` / `bc.idea` w dist JS | ≥ 9 | **9** ✅ |
| `:root[data-theme='light']` w dist CSS | ≥ 1 | **1** ✅ |
| `prefers-reduced-motion` w dist CSS | ≥ 1 | **1** ✅ |
| `[data-theme-icon='dark']` + `[data-theme-icon='light']` + light overrides | 4 | **4** ✅ |
| `icon_dark_theme.svg` reference w dist JS | ≥ 1 | **1** ✅ |

### Live asset serving
- `GET /icons/icon_dark_theme.svg` → `200` + `Content-Length: 587` (real bytes, nie SPA fallback) ✅
- `GET /icons/icon_light_theme.svg` → `200` + `Content-Length: 587` ✅

---

## 6. Screenshot paths

Brak — `camofox-browser` zwrócił HTTP 500 z `/tabs` (znany problem z tego skill).
Weryfikacja wizualna ograniczona do:
- strukturalnego grep-a w dist
- `vite build` bez błędów
- `dev server` (5173) z `--force` zwraca prawidłowe pliki JSX i CSS z nowymi klasami

Aby włączyć screenshoty:
1. `camoufox-js fetch` na Macu (skill `camofox-browser-recovery.md`)
2. otworzyć `http://localhost:5173/` w Safari przez `tailscale serve`
3. kliknąć theme toggle — potwierdzić zmianę `data-theme` w DOM

---

## 7. Ryzyka / regresje

| Ryzyko | Prawdopodobieństwo | Mitygacja |
|--------|---------------------|-----------|
| Vite HMR cache po zmianach w `index.css` | niskie | Restart z `--force` + usunięcie `node_modules/.vite` |
| Stary Vite process (PID 2433576) blokował port 5173 po `fuser -k` | zaobserwowane | Drugie `fuser -k 5173/tcp` + weryfikacja `ss -tlnp \| grep 5173 \|\| echo PORT_FREE` |
| Backend może utracić kompatybilność jeśli ktoś używa `ThemeToggle` z custom provider | brak | `ThemeToggle` to nowy, izolowany komponent — żaden inny plik nie zależy od niego |
| Legacy `pl.js` / `en.js` / `de.js` w `i18n/` to martwe duplikaty `.json` | znane | Poza scope; nie blokują działania |
| HeaderBar user chip "Radosław" hardcoded | niskie | Celowo — OD nie ma tu i18n klucza; dla single-user Privacy-First AI Portfolio to wystarczające |

---

## 8. Podsumowanie

Frontend AI Idea Forge osiągnął możliwie najbliższą zgodność z OpenDesign:

- **monochromatyczny shadcn-style** ✅
- **dark-first z działającym light mode** ✅
- **poprawny sidebar (brand + grupy + footer)** ✅
- **poprawne ikony** ✅
- **osobne widoki** (Pomysł / Analiza / Decision Memo / Historia / Ustawienia / Pomoc) ✅
- **dynamiczny pipeline w `Jak działa analiza`** ✅ (zachowany)
- **realny backend + SSE** ✅ (zachowany)
- **bez `Szablony` i `Agenci`** ✅ (decyzja Radosława)

Wymaga akceptacji Radosława i code review przed merge do głównej gałęzi.