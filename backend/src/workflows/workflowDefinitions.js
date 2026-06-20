/**
 * AI Idea Forge — Workflow Definitions
 * Definicje trybów pracy (workflows).
 *
 * Uwaga: tryb `decision_memo` ma etykietę UI "Szybka rekomendacja" /
 * "Quick Recommendation" / "Empfehlung erstellen" — tłumaczenia w i18n.
 * Końcowy artefakt dla KAŻDEGO trybu nadal jest "Decision Memo"
 * (budowany przez backend/src/artifacts/decisionMemoBuilder.js).
 */

export const WORKFLOW_DEFINITIONS = {
  develop_idea: {
    id: 'develop_idea',
    name: 'Rozwiń pomysł',
    description: 'Rozwija pomysł, proponuje warianty i szanse.',
    agents: ['generator', 'editor', 'decider'],
    summary: 'Generator rozwija pomysł i warianty → Redaktor porządkuje → Decydent formułuje rekomendację, status i następny krok.',
  },
  critique_idea: {
    id: 'critique_idea',
    name: 'Skrytykuj pomysł',
    description: 'Krytyczna analiza pomysłu, szukanie słabych punktów.',
    agents: ['skeptic', 'pragmatist', 'editor', 'decider'],
    summary: 'Sceptyk szuka słabości i ukrytych założeń → Pragmatyk oddziela realne problemy od abstrakcji → Redaktor porządkuje → Decydent daje rekomendację.',
  },
  premortem: {
    id: 'premortem',
    name: 'Pre-mortem',
    description: 'Analiza ryzyk zanim projekt się nie powiedzie.',
    agents: ['redteam', 'skeptic', 'pragmatist', 'editor', 'decider'],
    summary: 'Red Team robi pre-mortem i identyfikuje scenariusze porażki → Sceptyk sprawdza założenia → Pragmatyk proponuje zabezpieczenia → Redaktor porządkuje → Decydent kończy statusem i następnym krokiem.',
  },
  compare_variants: {
    id: 'compare_variants',
    name: 'Porównaj warianty',
    description: 'Porównuje warianty rozwiązań.',
    agents: ['generator', 'pragmatist', 'skeptic', 'editor', 'decider'],
    summary: 'Generator normalizuje/uzupełnia warianty → Pragmatyk porównuje wykonalność i minimalny eksperyment → Sceptyk sprawdza słabości → Redaktor porządkuje → Decydent wskazuje rekomendowaną opcję.',
  },
  decision_memo: {
    id: 'decision_memo',
    name: 'Szybka rekomendacja',
    description: 'Syntetyczna rekomendacja, decyzja i następny krok.',
    agents: ['pragmatist', 'editor', 'decider'],
    summary: 'Pragmatyk sprawdza wykonalność i minimalny eksperyment → Redaktor porządkuje materiał (wymagany technicznie do formatowania końcowego artefaktu Decision Memo) → Decydent formułuje końcową rekomendację.',
  },
  full_analysis: {
    id: 'full_analysis',
    name: 'Pełna analiza',
    description: 'Pełny pipeline: rozwinięcie, krytyka, wykonalność, ryzyka, redakcja i rekomendacja.',
    agents: ['generator', 'skeptic', 'pragmatist', 'redteam', 'editor', 'decider'],
    summary: 'Generator rozwija pomysł i warianty → Sceptyk szuka słabych punktów → Pragmatyk sprawdza wykonalność → Red Team robi pre-mortem → Redaktor porządkuje materiał → Decydent formułuje końcową rekomendację.',
  },
};
