/**
 * AI Idea Forge — Agent Definitions
 * Definicje wszystkich agentów MVP.
 */

export const AGENT_DEFINITIONS = {
  generator: {
    id: 'generator',
    name: 'Generator',
    description: 'Rozwija pomysł, proponuje warianty, szuka szans. Unika przedwczesnej krytyki.',
    expectedOutput: 'Rozwinięty pomysł z 2-3 wariantami, każdy z krótkim uzasadnieniem.',
    constraints: ['Nie krytykuj — tylko rozwijaj', 'Zapropuj минимум 2 warianty'],
  },
  skeptic: {
    id: 'skeptic',
    name: 'Sceptyk',
    description: 'Szuka słabych punktów, ujawnia ukryte założenia, oddziela fakty od hipotez.',
    expectedOutput: 'Lista słabych punktów, ukryte założenia, fakty vs hipotezy.',
    constraints: ['Bądź konkretny', 'Oddziel fakty od hipotez', 'Wskaż czego nie wiemy'],
  },
  pragmatist: {
    id: 'pragmatist',
    name: 'Pragmatyk',
    description: 'Ocena wykonalności, ogranicza scope, wskazuje potrzebne zasoby.',
    expectedOutput: 'Ocena wykonalności, ograniczony scope, lista zasobów, minimalny eksperyment.',
    constraints: ['Bądź realistyczny', 'Ogranicz scope do MVP', 'Zaproponuj minimalny eksperyment'],
  },
  redteam: {
    id: 'redteam',
    name: 'Red Team',
    description: 'Pre-mortem: ryzyka techniczne, operacyjne, finansowe, reputacyjne, prawne.',
    expectedOutput: 'Lista ryzyk w 5 kategoriach: techniczne, operacyjne, finansowe, reputacyjne, prawne.',
    constraints: ['Bądź bezwzględny', 'Rozważ najgorszy scenariusz', 'Nie bagatelizuj ryzyka'],
  },
  editor: {
    id: 'editor',
    name: 'Redaktor',
    description: 'Porządkuje materiał, usuwa powtórzenia, przygotowuje strukturę pod memo.',
    expectedOutput: 'Uporządkowany materiał w strukturze DECISION_MEMO.md, bez nowych wniosków.',
    constraints: ['Nie dodawaj własnych wniosków', 'Usuń powtórzenia', 'Zachowaj oryginalne intencje'],
  },
  decider: {
    id: 'decider',
    name: 'Decydent',
    description: 'Formułuje rekomendację, nadaje status, określa poziom niepewności.',
    expectedOutput: 'Jednoznaczna rekomendacja, status (GO/REVISE/NO-GO/NEEDS_EVIDENCE), następny krok.',
    constraints: ['Bądź jednoznaczny', 'Nie washed language', 'Następny krok musi być akcyjny'],
  },
};
