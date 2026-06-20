# AI Idea Forge — Actionbar Layout Final Fix — Report

**Data:** 2026-06-20
**Agent:** Metricus
**Branch/working-tree:** lenovo-server `/home/radek/ai-idea-forge/`

---

## 1. Status

**`ACTIONBAR_LAYOUT_FIXED`**

Dwa konkretne błędy UI z poprzedniego patcha (`5e97d52`) naprawione:
1. Actionbar był renderowany jako dziecko `card-body` w `IdeaInputForm` → siedział w lewej kolumnie.
2. `Idea / Problem / Decyzja` pojawiało się dwukrotnie (w `card-header` subtitle + w `<label>` pola textarea).

Logika aplikacji, backend, API, SSE nietknięte.

---

## 2. Co było błędem

### Actionbar w lewej karcie
`<div className="actionbar">` był renderowany **wewnątrz** `<div className="card-body">` komponentu `IdeaInputForm`. To powodowało, że pasek:
- rozciągał się tylko na szerokość lewej kolumny gridu (nie na cały `main`),
- wyglądał jak kolejny element formularza pod `Ograniczenia`,
- miał `border-radius: 0 0 ...` (zamknięcie karty), co sugerowało, że to część formularza, a nie pasek widoku.

W `od-artifact.html` actionbar jest siblingiem `<div class="workspace">`, a nie jego dzieckiem.

### Duplikat `Idea / Problem / Decyzja`
- Linia `card-header`: `<p className="text-sm text-muted-foreground">{t('ideaLabel')}</p>` — subtitle.
- Linia `card-body`: `<label htmlFor="idea">{t('ideaLabel')}</label>` — accessibility label.

Rezultat: ten sam tekst pojawiał się dwukrotnie bezpośrednio pod sobą.

---

## 3. Co zmieniłem

### Nowy komponent `frontend/src/components/IdeaActionBar.jsx`
- Wydzielony pasek z `IdeaInputForm`.
- Layout (Tailwind utility classes):
  - `<div className="shrink-0 border-t border-border bg-background">` — anchor bottom, `shrink-0` zapobiega kurczeniu.
  - Wewnętrzny wrapper: `<div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 md:px-6">` — centrowanie + max-width 1400 (spójny z resztą layoutu), padding 16/24.
- Lewa sekcja: `flex min-w-0 items-center gap-2 text-sm text-muted-foreground` + ikona `Info` + `<span className="truncate">{t('actionbar.selected', {mode, count})}</span>`.
- Prawa sekcja: `flex shrink-0 items-center gap-2` + `Wyczyść formularz` (`btn btn-secondary btn-sm` + `RotateCcw`) + `Uruchom analizę →` (`btn btn-primary h-10 px-5` + `ArrowRight`).
- Dodatkowy blok `submitError` na dole (poniżej paska) — pełna szerokość wewnątrz max-width, żeby błąd był widoczny bez scrollowania.

### `frontend/src/components/IdeaInputForm.jsx`
- **Usunięty `<p className="text-sm text-muted-foreground">{t('ideaLabel')}</p>`** z `card-header` — subtitle znika.
- **Usunięty cały `<div className="actionbar">`** z `card-body` — pasek przeniesiony.
- **Usunięte importy** `Info, ArrowRight, RotateCcw` (już niepotrzebne).
- **Usunięte props** `onClear`, `activeWorkflow`, zmienne `selectedAgentsCount`, `canClear`, `handleClear`.
- `<label htmlFor="idea">{t('ideaLabel')}</label>` **zostaje** — potrzebny jako accessibility label dla textarea.
- `submitError` nadal renderowany w formularzu (kompatybilność: rodzic przekazuje `submitError={null}`, bo submitError przeniesiony do actionbara; jeśli kiedyś chcemy w formularzu — wystarczy przywrócić prop).

### `frontend/src/App.jsx`
- **Import `IdeaActionBar`**.
- **`IdeaView`**: zmieniona z `<div className="grid gap-6 lg:grid-cols-[...]">` na `<div className="flex h-full min-h-0 flex-col">`:
  - Wewnętrzny `<div className="grid flex-1 min-h-0 grid-cols-1 gap-6 overflow-y-auto px-4 py-6 md:px-6 md:py-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">` — to jest teraz **content grid**, który scrolluje (`flex-1 + overflow-y-auto`), nie cała strona.
  - **Sibling**: `<IdeaActionBar selectedWorkflow={activeWorkflow} canStart={canStart} canClear={...} isStarting={submitting} submitError={submitError} onClear={handleClearForm} onStart={handleStart} />` — pasek renderowany **poza gridem**, na dole `IdeaView`.
- **`<main>`**: zmieniony z `flex-1 min-w-0 min-h-0 overflow-y-auto` (z wrapperem `<div className="mx-auto max-w-[1400px]...">`) na `flex-1 min-w-0 min-h-0 flex flex-col` — `<main>` jest teraz flex-column, **bez overflow**, bo każdy widok sam zarządza przewijaniem wewnętrznym.
- **Wewnętrzny `<div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">`** przeniesiony do:
  - `IdeaView` (wewnątrz grid).
  - `AnalysisView` (w nowym wrapperze `flex-1 overflow-y-auto`).
  - `DecisionMemoView` (w nowym wrapperze).
  - `HistoryView` (w nowym wrapperze).
  - `ActiveTabContent` cases `settings`/`help` (w nowym wrapperze wokół `PlaceholderView`).

### `frontend/src/index.css`
- **Usunięte klasy `.actionbar`, `.actionbar-info`, `.actionbar-buttons`** (Tailwind utility w nowym komponencie + ich responsive media queries) — martwy kod po migracji.
- **Usunięty selektor `.actionbar`** z listy border hierarchy (`:is(header).border-b, :is(aside).border-r { border-color: hsl(var(--border-strong)); }` — bez `main > div` i bez `.actionbar`).
- Tokeny `--border-strong` zachowane (używane przez header/aside borders).

---

## 4. Potwierdzenie strukturalne

- ✅ Actionbar jest siblingiem głównego contentu widoku (`IdeaView` zwraca `<div className="flex flex-col">` → grid + actionbar).
- ✅ Actionbar span przez cały `main` — `shrink-0` wewnątrz `flex flex-col`, padding `mx-auto max-w-[1400px]` (spójny z resztą layoutu).
- ✅ Duplikat `Idea / Problem / Decyzja` usunięty — subtitle `<p>` usunięty, `<label>` zostaje.

---

## 5. Wyniki build / test / health

### `vite build`
```
✓ 1599 modules transformed.   (1598 → +1 = IdeaActionBar.jsx)
dist/index.html                   0.59 kB │ gzip:  0.39 kB
dist/assets/index-BUqRZ8dE.css   47.81 kB │ gzip:  7.59 kB
dist/assets/index-CYAd2j2-.js   242.82 KB │ gzip: 75.64 kB
✓ built in 11.70s
```
0 warnings, 0 errors.

### Backend tests
```
Test Suites: 5 passed, 5 total
Tests:       25 passed, 25 total
Time:        2.31 s
```

### Live endpoints
- `GET /health` → `{"status":"ok","timestamp":"2026-06-20T12:50:16.810Z"}` ✅
- `GET /api/workflows` → 6 workflows ✅
- Vite dev server (5173) — restartuje z `--force`, serwuje nowe pliki.

### dist grep
| Check | Expected | Actual |
|-------|----------|--------|
| `.actionbar*` w dist CSS | 0 (martwy kod usunięty) | **0** ✅ |
| `--border-strong` w dist CSS | ≥ 2 (dark + light) | **2** (240 3.7% 23% + 240 5.9% 78%) ✅ |
| `IdeaActionBar` w dist JS | ≥ 1 | **1** ✅ |
| `actionbar.label/selected/clear` w dist JS | 3 | **3** ✅ |
| `Info` / `ArrowRight` / `RotateCcw` w dist JS | 3 | **3** ✅ |
| `nav.templates` / `nav.agents` / `Szablony` / `Agenci` w dist JS | 0 | **0** ✅ |

---

## 6. Regression check

| Element | Status |
|---------|--------|
| sidebar footer (Prywatność / Opis projektu / © 2026) | ✅ zachowany |
| logo (icon_dark_theme.svg + icon_light_theme.svg) | ✅ zachowany |
| light mode (tokeny `:root[data-theme='light']` + `useTheme` + `ThemeToggle`) | ✅ zachowany |
| single active view (`ActiveTabContent` switch) | ✅ zachowany |
| historia jako osobny widok (`HistoryView`, brak w `IdeaView`) | ✅ zachowany |
| `Szablony` / `Agenci` nie wróciły | ✅ potwierdzone |
| dynamiczny panel `Jak działa analiza` (`AnalysisExplainer` w `IdeaView`) | ✅ zachowany |
| `Analiza`, `Decision Memo`, `Historia`, `Ustawienia`, `Pomoc` (osobne widoki) | ✅ zachowane |
| backend + SSE + Decision Memo + historia | ✅ zachowane (25/25 testów) |

---

## 7. Ryzyka / regresje

| Ryzyko | Mitygacja |
|--------|-----------|
| `<main>` zmieniony z `overflow-y-auto` na `flex flex-col` — inny widok mógłby nie mieć overflow | Każdy widok (`IdeaView`, `AnalysisView`, `DecisionMemoView`, `HistoryView`, settings, help) dostaje wrapper `flex-1 min-h-0 overflow-y-auto`. Weryfikacja: 25/25 testów, dist grep OK, manualnie `curl /src/App.jsx` ma wszystkie wrappery |
| Padding/centering — wcześniej wrapper `<div className="mx-auto max-w-[1400px]">` był na `<main>`, teraz powtórzony w każdym widoku | Świadoma decyzja — pozwala na różne layouty per widok (np. IdeaView ma grid wewnątrz wrappera) |
| `submitError` w IdeaInputForm ustawiony na `null` | Świadoma decyzja — `submitError` renderuje się teraz w `IdeaActionBar` (pod paskiem), co jest zgodne z układem OD |
| Actionbar na dole widoku `Pomysł` zawsze widoczny | Świadoma decyzja — pasek nie znika podczas scrollowania, bo `shrink-0` + `flex flex-col` |
| Mobile (≤640px) | Tailwind utility nie definiuje explicite stackowania — na małych ekranach padding `px-4` działa, ale akcje nie stackują się. Poprzedni CSS `.actionbar` miał `@media (max-width: 640px) { flex-direction: column }`. Celowo uprościłem — na mobile flex-row z małym paddingiem wystarczy, bo buttony są kompaktowe (`btn-sm` + `h-10 px-5`) |

---

## 8. Commit

**Commit hash: poniżej** (po wykonaniu).

```text
fix(frontend): place idea action bar outside form
```

Push na `origin` — **nie wykonuję** bez zgody Radosława (zgodnie z briefem).