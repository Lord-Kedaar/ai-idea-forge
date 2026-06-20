/**
 * AI Idea Forge — Provider Registry
 * Rejestruje i instancjonuje providerów AI.
 *
 * Dodanie nowego providera:
 *   1. Utwórz plik w ./providers/<name>Provider.js
 *   2. Zaimportuj go tutaj
 *   3. Dodaj do PROVIDERS map
 */

import { FakeProvider } from './fakeProvider.js';
import { OmlxProvider } from './omlxProvider.js';
import { FreeLLMApiProvider } from './freeLLMApiProvider.js';
import { GroqProvider } from './groqProvider.js';
import { MistralProvider } from './mistralProvider.js';

/**
 * Lista zarejestrowanych providerów.
 */
const PROVIDERS = {
  fake: FakeProvider,
  omlx: OmlxProvider,
  freellmapi: FreeLLMApiProvider,
  groq: GroqProvider,
  mistral: MistralProvider,
};

/**
 * Aktywny provider (instancja).
 */
let activeProvider = null;
let activeProviderId = null;

/**
 * Inicjalizuj providera.
 * @param {string} providerId
 * @param {object} config — config przekazany do providera
 */
export function initProvider(providerId, config = {}) {
  const ProviderClass = PROVIDERS[providerId];
  if (!ProviderClass) {
    throw new Error(`Nieznany provider: ${providerId}. Dostępne: ${Object.keys(PROVIDERS).join(', ')}`);
  }
  activeProvider = new ProviderClass(config);
  activeProviderId = providerId;
  return activeProvider;
}

/**
 * Pobierz aktywny provider.
 */
export function getActiveProvider() {
  if (!activeProvider) {
    throw new Error('Provider nie zainicjalizowany. Wywołaj initProvider() najpierw.');
  }
  return activeProvider;
}

/**
 * Pobierz ID aktywnego providera.
 */
export function getActiveProviderId() {
  return activeProviderId;
}

/**
 * Lista dostępnych providerów (bez instancji).
 */
export function listProviders() {
  return Object.keys(PROVIDERS);
}

export { PROVIDERS };
