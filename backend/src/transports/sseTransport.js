/**
 * AI Idea Forge — SSE Transport helper
 * Sets up SSE response with standard headers.
 */

export function setupSSE(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
  res.flushHeaders();
}

export function writeSSEEvent(res, eventType, data) {
  if (res.writableEnded) return;
  try {
    res.write(`data: ${JSON.stringify({ type: eventType, ...data })}\n\n`);
  } catch (err) {
    console.warn('[SSE] write error:', err.message);
  }
}

export function writeSSEPing(res) {
  if (res.writableEnded) return;
  try {
    res.write(': ping\n\n');
  } catch {}
}
