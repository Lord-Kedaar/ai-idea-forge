// Workflow definitions consumed by both backend and frontend.
// Mirrors backend/src/workflows/workflowDefinitions.js (PL label only — i18n keys).
export const WORKFLOWS = [
  {
    id: 'develop_idea',
    icon: 'Sparkles',
    agents: ['generator', 'editor', 'decider'],
    description_pl: 'Warianty, szanse, odbiorcy i możliwe kierunki.',
  },
  {
    id: 'critique_idea',
    icon: 'ShieldQuestion',
    agents: ['skeptic', 'pragmatist', 'editor', 'decider'],
    description_pl: 'Słabe punkty, ukryte założenia i pytania otwarte.',
  },
  {
    id: 'premortem',
    icon: 'ShieldAlert',
    agents: ['redteam', 'skeptic', 'pragmatist', 'editor', 'decider'],
    description_pl: 'Załóżmy, że projekt się nie udał. Dlaczego?',
  },
  {
    id: 'compare_variants',
    icon: 'GitCompare',
    agents: ['generator', 'pragmatist', 'skeptic', 'editor', 'decider'],
    description_pl: 'Porównanie opcji, ryzyk i warunków wyboru.',
  },
  {
    id: 'decision_memo',
    icon: 'Zap',
    agents: ['pragmatist', 'editor', 'decider'],
    description_pl: 'Syntetyczna rekomendacja, decyzja i następny krok.',
  },
  {
    id: 'full_analysis',
    icon: 'Workflow',
    agents: ['generator', 'skeptic', 'pragmatist', 'redteam', 'editor', 'decider'],
    description_pl: 'Pełny pipeline: rozwinięcie, krytyka, wykonalność, ryzyka, redakcja i rekomendacja.',
  },
];

// Static agent metadata used by the dynamic explainer.
export const AGENT_META = {
  generator: { name_pl: 'Generator', desc_pl: 'Rozwija pomysł i proponuje warianty.', icon: 'Sparkles' },
  skeptic: { name_pl: 'Sceptyk', desc_pl: 'Szuka słabych punktów i ukrytych założeń.', icon: 'ShieldQuestion' },
  pragmatist: { name_pl: 'Pragmatyk', desc_pl: 'Sprawdza wykonalność i minimalny eksperyment.', icon: 'Target' },
  redteam: { name_pl: 'Red Team', desc_pl: 'Robi pre-mortem i identyfikuje ryzyka.', icon: 'ShieldAlert' },
  editor: { name_pl: 'Redaktor', desc_pl: 'Porządkuje materiał i usuwa powtórzenia.', icon: 'FilePenLine' },
  decider: { name_pl: 'Decydent', desc_pl: 'Formułuje rekomendację, status i następny krok.', icon: 'BadgeCheck' },
};

export const AGENT_ORDER = ['generator', 'skeptic', 'pragmatist', 'redteam', 'editor', 'decider'];