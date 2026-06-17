# Runbook — AI Idea Forge

## Start produkcyjny

### 1. Weryfikacja env

```bash
# Sprawdź że wszystkie wymagane zmienne są ustawione
NODE_ENV=production
PORT=3210
OMLX_BASE_URL=http://localhost:8585
OMLX_API_KEY=<key>
RUN_STORAGE_DIR=./data/runs
LOG_LEVEL=info
```

### 2. Build frontend

```bash
npm run build
# Wynik: frontend/dist/
```

### 3. Start backend

```bash
npm start
# lub z PM2 / supervisord
```

### 4. Health check

```bash
curl http://localhost:3210/health
```

## Monitorowanie

- Logi: `logs/` + `data/runs/<runId>/`
- Metryki: `/health` endpoint
- SSE events: `GET /api/forge/runs/:runId/events`

## Restart procedura

1. Zatrzymaj backend (SIGTERM)
2. Backup `data/runs/` jeśli potrzebne
3. Aktualizacja kodu
4. `npm install`
5. Start backend

## Rollback

1. Zatrzymaj backend
2. Przywróć poprzednią wersję kodu
3. `npm install`
4. Start backend

## Escalation

- Błąd providera AI → sprawdź OMLX API
- Błąd timeout → zwiększ TURN_TIMEOUT_MS
- Disk full → sprawdź data/runs/ i wyczyść stare runy
