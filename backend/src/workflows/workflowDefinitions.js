/**
 * AI Idea Forge — Workflow Definitions
 * Definicje trybów pracy (workflows).
 */

export const WORKFLOW_DEFINITIONS = {
  develop_idea: {
    id: 'develop_idea',
    name: 'Rozwiń pomysł',
    description: 'Rozwija pomysł, proponuje warianty i szanse.',
    agents: ['generator', 'editor'],
    summary: 'Generator rozwija pomysł → Redaktor porządkuje.',
  },
  critique_idea: {
    id: 'critique_idea',
    name: 'Skrytykuj pomysł',
    description: 'Krytyczna analiza pomysłu, szukanie słabych punktów.',
    agents: ['skeptic', 'editor'],
    summary: 'Sceptyk krytykuje → Redaktor porządkuje.',
  },
  premortem: {
    id: 'premortem',
    name: 'Pre-mortem',
    description: 'Analiza ryzyk zanim projekt się nie powiedzie.',
    agents: ['redteam', 'editor'],
    summary: 'Red Team robi pre-mortem → Redaktor porządkuje.',
  },
  compare_variants: {
    id: 'compare_variants',
    name: 'Porównaj warianty',
    description: 'Porównuje warianty rozwiązań.',
    agents: ['generator', 'pragmatist', 'skeptic', 'editor'],
    summary: 'Generator → Pragmatyk → Sceptyk → Redaktor.',
  },
  decision_memo: {
    id: 'decision_memo',
    name: 'Decision Memo',
    description: 'Pełny pipeline: Generator → Sceptyk → Pragmatyk → Red Team → Redaktor → Decydent.',
    agents: ['generator', 'skeptic', 'pragmatist', 'redteam', 'editor', 'decider'],
    summary: 'Generator → Sceptyk → Pragmatyk → Red Team → Redaktor → Decydent → DECISION_MEMO.md.',
  },
};
