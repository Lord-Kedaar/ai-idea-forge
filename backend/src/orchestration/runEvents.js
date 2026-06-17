/**
 * AI Idea Forge — Run Events
 * SSE event emitter for run lifecycle.
 */

export class RunEvents {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Rejestruj listener dla eventu.
   */
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);
    return () => this.off(eventType, callback);
  }

  /**
   * Usuń listener.
   */
  off(eventType, callback) {
    this.listeners.get(eventType)?.delete(callback);
  }

  /**
   * Emit event do wszystkich listenerów.
   */
  emit(eventType, data) {
    const cbs = this.listeners.get(eventType) || [];
    for (const cb of cbs) {
      try {
        cb({ type: eventType, ...data, timestamp: new Date().toISOString() });
      } catch (err) {
        console.error(`[RunEvents] callback error for ${eventType}:`, err.message);
      }
    }
  }

  /**
   * Helper: emit to SSE response object (res).
   */
  emitToResponse(res, eventType, data) {
    if (res.writableEnded) return;
    try {
      res.write(`data: ${JSON.stringify({ type: eventType, ...data })}\n\n`);
    } catch (err) {
      console.error(`[RunEvents] SSE write error:`, err.message);
    }
  }
}
