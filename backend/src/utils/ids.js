/**
 * AI Idea Forge — IDs utility
 * Generates unique IDs for runs and agents.
 */

import { randomBytes } from 'crypto';

/**
 * Generates a random ID string (URL-safe, 16 bytes hex).
 */
export function randomId() {
  return randomBytes(12).toString('hex');
}
