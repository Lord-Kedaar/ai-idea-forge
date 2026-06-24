/**
 * utils.js — shared utility helpers for AI Idea Forge frontend.
 */

/**
 * cn — classnames helper. Joins truthy class strings, drops falsy values.
 * Used everywhere Tailwind utility composition is needed.
 */
export function cn(...args) {
  return args
    .flat(Infinity)
    .filter((c) => typeof c === 'string' && c.trim().length > 0)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
