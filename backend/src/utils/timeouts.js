/**
 * AI Idea Forge — Timeouts utility
 * AbortController-based timeouts for agent calls.
 */

/**
 * Creates an AbortSignal that times out after `ms` milliseconds.
 * Returns a wrapper that has both the signal AND an abort() method.
 */
export function createTimeoutAbortSignal(ms) {
  const controller = new AbortController();
  const { signal } = controller;

  const timer = setTimeout(() => controller.abort(), ms);

  // Attach timer so we can clear it
  signal._clear = () => clearTimeout(timer);

  return signal;
}

/**
 * Clear a timeout abort signal (call if you got a response before timeout).
 */
export function clearTimeoutAbortSignal(signal) {
  if (signal._clear) {
    signal._clear();
  }
}
