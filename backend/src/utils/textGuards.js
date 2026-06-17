/**
 * AI Idea Forge — Text Guards utility
 * Basic degeneration detection and text normalization.
 */

/**
 * Check if text looks like it degenerated (repetitive patterns).
 */
export function looksDegenerate(text, threshold = 0.3) {
  if (!text || text.length < 50) return false;
  const words = text.toLowerCase().split(/\s+/);
  if (words.length < 10) return false;
  const unique = new Set(words);
  const ratio = unique.size / words.length;
  return ratio < threshold;
}

/**
 * Normalize text: trim, collapse whitespace.
 */
export function normalizeText(text) {
  if (!text) return '';
  return text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
}
