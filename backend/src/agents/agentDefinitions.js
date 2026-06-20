/**
 * AI Idea Forge — Agent Definitions
 * Każdy agent ma przypisany provider + model + reasoningEffort.
 *
 * Routing:
 *   generator  → Groq / qwen/qwen3.6-27b         reasoningEffort: none
 *   skeptic   → Groq / qwen/qwen3.6-27b         reasoningEffort: none
 *   pragmatist→ Groq / qwen/qwen3.6-27b         reasoningEffort: none
 *   redteam   → Groq / openai/gpt-oss-120b     reasoningEffort: low
 *   editor    → Mistral / mistral-small-2603    reasoningEffort: none
 *   decider   → Mistral / mistral-small-2603    reasoningEffort: low
 *   fallback  → oMLX / gemma-4-26B-A4B-it-QAT-MLX-4bit
 */

export const AGENT_DEFINITIONS = {
  generator: {
    id: 'generator',
    name: 'Generator',
    provider: 'groq',
    model: 'qwen/qwen3.6-27b',
    reasoningEffort: 'none',
    description: 'Rozwija pomysł, proponuje warianty, szuka szans. Unika przedwczesnej krytyki.',
    expectedOutput: 'Rozwinięty pomysł z 2-3 wariantami, każdy z krótkim uzasadnieniem.',
    constraints: ['Nie krytykuj — tylko rozwijaj', 'Zaproponuj minimum 2 warianty'],
  },
  skeptic: {
    id: 'skeptic',
    name: 'Sceptyk',
    provider: 'groq',
    model: 'qwen/qwen3.6-27b',
    reasoningEffort: 'none',
    description: 'Szuka słabych punktów, ujawnia ukryte założenia, oddziela fakty od hipotez.',
    expectedOutput: 'Lista słabych punktów, ukryte założenia, fakty vs hipotezy.',
    constraints: ['Bądź konkretny', 'Oddziel fakty od hipotez', 'Wskaż czego nie wiemy'],
  },
  pragmatist: {
    id: 'pragmatist',
    name: 'Pragmatyk',
    provider: 'groq',
    model: 'qwen/qwen3.6-27b',
    reasoningEffort: 'none',
    description: 'Ocena wykonalności, ogranicza scope, wskazuje potrzebne zasoby.',
    expectedOutput: 'Ocena wykonalności, ograniczony scope, lista zasobów, minimalny eksperyment.',
    constraints: ['Bądź realistyczny', 'Ogranicz scope do MVP', 'Zaproponuj minimalny eksperyment'],
  },
  redteam: {
    id: 'redteam',
    name: 'Red Team',
    provider: 'groq',
    model: 'openai/gpt-oss-120b',
    reasoningEffort: 'low',
    description: 'Pre-mortem: ryzyka techniczne, operacyjne, finansowe, reputacyjne, prawne.',
    expectedOutput: 'Lista ryzyk w 5 kategoriach: techniczne, operacyjne, finansowe, reputacyjne, prawne.',
    constraints: ['Bądź bezwzględny', 'Rozważ najgorszy scenariusz', 'Nie bagatelizuj ryzyka'],
  },
  editor: {
    id: 'editor',
    name: 'Redaktor',
    provider: 'mistral',
    model: 'mistral-small-2603',
    reasoningEffort: 'none',
    description: 'Porządkuje materiał, usuwa powtórzenia, przygotowuje strukturę pod memo.',
    expectedOutput: 'Uporządkowany materiał w strukturze DECISION_MEMO.md, bez nowych wniosków.',
    constraints: ['Nie dodawaj własnych wniosków', 'Usuń powtórzenia', 'Zachowaj oryginalne intencje'],
  },
  decider: {
    id: 'decider',
    name: 'Decydent',
    provider: 'mistral',
    model: 'mistral-small-2603',
    reasoningEffort: 'low',
    description: 'Formułuje rekomendację, nadaje status, określa poziom niepewności.',
    expectedOutput: 'Jednoznaczna rekomendacja, status (GO/REVISE/NO-GO/NEEDS_EVIDENCE), następny krok.',
    constraints: ['Bądź jednoznaczny', 'Nie wash language', 'Następny krok musi być akcyjny'],
  },
};
