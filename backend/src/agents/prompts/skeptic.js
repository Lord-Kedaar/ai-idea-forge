/**
 * AI Idea Forge — Prompts for skeptic agent.
 */
import { generateSystemPrompt, generateUserPrompt } from './index.js';

export const generateAgentSystemPrompt = (context) => generateSystemPrompt('skeptic', context);
export const generateAgentUserPrompt = (context) => generateUserPrompt('skeptic', context);
