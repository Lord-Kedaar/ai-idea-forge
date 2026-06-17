# Local Setup — AI Idea Forge

## Wymagania

- Node.js 22+
- OMLX API server (lub inny OpenAILike compatible) na porcie 8585

## Krok po kroku

### 1. Clone / pobierz projekt

```bash
mkdir -p /home/radek/ai-idea-forge
cd /home/radek/ai-idea-forge
```

### 2. Zainstaluj backend dependencies

```bash
npm install
```

### 3. Zainstaluj frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 4. Skonfiguruj .env

```bash
cp .env.example .env
nano .env
```

Minimalne wymagane:
```
NODE_ENV=development
PORT=3210
OMLX_BASE_URL=http://localhost:8585
OMLX_API_KEY=twoj-klucz
RUN_STORAGE_DIR=./data/runs
```

### 5. Uruchom backend

```bash
npm run dev
# Backend nasłuchuje na http://localhost:3210
```

### 6. Uruchom frontend (nowy terminal)

```bash
cd frontend
npm run dev
# Vite dev server na http://localhost:5173
```

### 7. Weryfikacja health check

```bash
curl http://localhost:3210/health
```

Oczekiwana odpowiedź:
```json
{"status":"ok","timestamp":"..."}
```

## Development

- Backend auto-restart przy zmianach (jeśli używasz nodemon)
- Vite HMR dla frontend
- SSE events na `/api/forge/runs/:runId/events`
