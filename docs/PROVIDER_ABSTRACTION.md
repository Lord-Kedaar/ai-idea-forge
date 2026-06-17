# Provider Abstraction — AI Idea Forge

## Interface

Wszystkie wywołania AI idą przez wspólny interfejs `ProviderBridge`. Konkretna implementacja (OMLX, OpenAI, etc.) jest wstrzykiwana.

```javascript
// ProviderBridge interface
{
  complete(prompt, options) → Promise<{ content: string, reasoning?: string, finishReason: string }>
  stream(prompt, options, onChunk) → Promise<void>
}
```

## Konfiguracja

Provider wybierany przez `DEFAULT_PROVIDER` w env (domyślnie: `omlx`).

```javascript
// env
DEFAULT_PROVIDER=omlx
OMLX_BASE_URL=http://localhost:8585
OMLX_API_KEY=...
```

## OMLX Provider (implementacja MVP)

OpenAILike compatible API. Endpoint: `POST {OMLX_BASE_URL}/v1/chat/completions`

Request:
```json
{
  "model": "...",
  "messages": [{"role": "user", "content": "..."}],
  "max_tokens": 1200,
  "temperature": 0.45,
  "stream": false
}
```

Response:
```json
{
  "choices": [{"message": {"content": "..."}, "finish_reason": "stop"}]
}
```

## Params per agent

Każdy agent może mieć własne parametry generacji (temperature, max_tokens, etc.). AGENT_PROFILES definiuje te wartości.

```javascript
const AGENT_PROFILES = {
  context-analyst: {
    temperature: 0.4,
    max_tokens: 1000,
    top_p: 0.85,
  },
  // ...
}
```

## Retry policy

`PROVIDER_RETRY_ATTEMPTS` (domyślnie 2) — ile razy ponawiać przy błędzie sieciowym lub 5xx.

Timeout per request: `TURN_TIMEOUT_MS` (domyślnie 180s).
