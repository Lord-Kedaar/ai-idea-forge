import express from 'express';
import cors from 'cors';
import { loadEnv } from './config/env.js';
import { initProvider } from './providers/providerRegistry.js';
import healthRouter from './routes/health.js';
import providersRouter from './routes/providers.js';
import agentsRouter from './routes/agents.js';
import workflowsRouter from './routes/workflows.js';
import { createForgeRun, getForgeRun, getForgeRunEvents, listForgeRuns, deleteForgeRun, cancelForgeRun } from './routes/forgeRuns.js';
import { getDecisionMemo } from './routes/artifacts.js';
import { rateLimitMiddleware, sessionLockMiddleware, getRateLimitInfo } from './middleware/rateLimit.js';
import { demoQuotaMiddleware, getDemoQuota, resetDemoQuota } from './middleware/demoQuota.js';

const env = loadEnv();

/**
 * Build provider-specific config from env.
 * Architecture stays provider-agnostic — no provider-specific code here.
 */
function buildProviderConfig(providerId) {
  switch (providerId) {
    case 'omlx':
      return {
        baseUrl: env.omlxBaseUrl,
        apiKey: env.omlxApiKey,
        model: env.defaultModel || undefined,
      };
    case 'freellmapi':
      return {
        baseUrl: env.freellmapiBaseUrl,
        apiKey: env.freellmapiApiKey,
        model: env.freellmapiModel || env.defaultModel || undefined,
      };
    case 'fake':
    default:
      return {
        model: env.defaultModel || undefined,
      };
  }
}

// Initialize provider
try {
  initProvider(env.defaultProvider, buildProviderConfig(env.defaultProvider));
  console.log(`[AI Idea Forge] Provider "${env.defaultProvider}" zainicjalizowany.`);
} catch (err) {
  console.warn(`[AI Idea Forge] Provider init warning: ${err.message}`);
}

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Access log
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  next();
});

// Health
app.get('/health', healthRouter);

// API
app.get('/api/providers', providersRouter);
app.get('/api/agents', agentsRouter);
app.get('/api/workflows', workflowsRouter);

// Demo quota — must be BEFORE forge runs so it can reject early
app.get('/api/demo-quota', getDemoQuota);
app.delete('/api/demo-quota', resetDemoQuota);

// Forge runs
app.post('/api/forge/runs', demoQuotaMiddleware, rateLimitMiddleware, sessionLockMiddleware, createForgeRun);
app.get('/api/rate-limit', (req, res) => {  const info = getRateLimitInfo(req);  res.json({ ...info, hourlyLimit: 10, dailyLimit: 100 });});
app.get('/api/forge/runs', listForgeRuns);
app.get('/api/forge/runs/:runId', getForgeRun);
app.post('/api/forge/runs/:runId/cancel', cancelForgeRun);
app.delete('/api/forge/runs/:runId', deleteForgeRun);
app.get('/api/forge/runs/:runId/events', getForgeRunEvents);
app.get('/api/forge/runs/:runId/artifacts/decision-memo', getDecisionMemo);

// Privacy policy (static page)
app.get('/privacy', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Prywatność — AI Idea Forge</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 720px; margin: 60px auto; padding: 0 20px; line-height: 1.7; color: #222; }
  h1 { font-size: 1.5rem; } h2 { font-size: 1.2rem; margin-top: 2rem; }
  a { color: #0066cc; }
</style>
</head>
<body>
<h1>Polityka prywatności — AI Idea Forge</h1>

<p><strong>AI Idea Forge</strong> to publiczne demo portfolio, udostępnione bez opłat.
Ma charakter eksperymentalny i służy testowaniu funkcji analizy pomysłów.</p>

<h2>Co zbieramy i dlaczego</h2>

<h3>Adres IP / identyfikator techniczny</h3>
<p>
Aplikacja jest wystawiona jako publiczne demo. Aby zapobiec nadużyciom (jeden użytkownik
zajmuje całą przepustowość), serwer przechowuje prosty licznik analiz powiązany
z adresem IP użytkownika.
</p>
<p>
W praktyce nie przechowujemy Twójego adresu IP w czystej postaci. Zamiast tego
tworzymy skrót (SHA-256) z adresu IP i nagłówka User-Agent. Ten skrót pozwala
nam zliczać analizy per użytkownik, ale nie pozwala nam (ani nikomu innemu)
odtworzyć Twojego adresu IP z zapisanego skrótu.
</p>
<p>
Limit wynosi 6 analiz na jeden adres IP. Po jego wyczerpaniu możesz wysłać
wiadomość na adres kontaktowy z prośbą o odblokowanie.
</p>

<h3>Pliki cookies</h3>
<p>
Używamy jednego pliku cookie (<code>forge_demo_acknowledged</code>) wyłącznie po to,
by zapamiętać, że przeczytałeś/aś komunikat informacyjny przy pierwszym wejściu.
Cookie nie służy do śledzenia Cię między sesjami ani do profilowania.
</p>

<h3>Dane analiz</h3>
<p>
Teksty i kontekst, które wklejasz do formularza, są przetwarzane przez zewnętrzne
API (FreeLLMApi / Groq / Mistral) na potrzeby działania agentów AI. Nie przechowujemy
ich po zakończeniu sesji poza logami błędów, które są automatycznie usuwane.
</p>

<h2>Co NIE robimy</h2>
<ul>
  <li>Nie sprzedajemy i nie udostępniamy danych reklamodawcom.</li>
  <li>Nie budujemy profilu marketingowego na podstawie Twojej aktywności.</li>
  <li>Nie dodajemy żadnych zewnętrznych usług analitycznych (Google Analytics, Mixpanel itp.).</li>
  <li>Nie śledzimy Cię między odwiedzinami różnych stron.</li>
</ul>

<h2>Pytania i kontakt</h2>
<p>
Jeśli masz pytania o swoje dane lub chcesz poprosić o odblokowanie limitu demo,
napisz na:
<a href="mailto:kontakt@radoslaw-pleskot.com?subject=AI%20Idea%20Forge%20%E2%80%94%20pytanie%20o%20dane">kontakt@radoslaw-pleskot.com</a>
</p>

<p><small>Wersja dokumentu: 2026-06-21</small></p>
</body>
</html>`);
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    code: err.code || `HTTP_${status}`,
  });
});

export default app;
