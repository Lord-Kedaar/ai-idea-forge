/**
 * AI Idea Forge — Health route
 * GET /health
 */

export default function healthRouter(req, res) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
