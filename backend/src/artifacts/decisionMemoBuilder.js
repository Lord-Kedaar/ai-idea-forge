/**
 * AI Idea Forge — Decision Memo Builder
 * Generates DECISION_MEMO.md from run state.
 */

import { AGENT_DEFINITIONS } from '../agents/agentDefinitions.js';

/**
 * Build a DECISION_MEMO.md string from run state.
 */
export function buildDecisionMemo(state) {
  const { idea, context, constraints, stages, workflowType } = state;

  const outputs = {};
  for (const stage of stages) {
    outputs[stage.agent] = stage.output || '';
  }

  const gen = outputs.generator || '';
  const skeptic = outputs.skeptic || '';
  const pragmatist = outputs.pragmatist || '';
  const redteam = outputs.redteam || '';
  const editor = outputs.editor || '';
  const decider = outputs.decider || '';

  // Extract facts vs assumptions from skeptic (simple heuristic split)
  const skepticLines = skeptic.split('\n').filter(l => l.trim());
  const facts = skepticLines.filter(l => /^\*\*[Ff]akt/i.test(l) || /^[•\-] .*(?:jest|to|są|to)/.test(l));
  const assumptions = skepticLines.filter(l => /założeni|assumption/i.test(l.toLowerCase()));
  const risks = redteam ? extractRisks(redteam) : [];

  // Extract recommendation from decider
  const { status, recommendation, nextStep } = extractDecision(decider);

  const memo = `# DECISION MEMO

## Problem

${idea}

${context ? `## Kontekst\n\n${context}\n` : ''}${constraints ? `## Ograniczenia\n\n${constraints}\n` : ''}## Propozycja

${gen || '_Brak analizy generatora._'}

## Fakty

${facts.length > 0 ? facts.join('\n') : '_Brak wyraźnie wskazanych faktów._'}

## Założenia

${assumptions.length > 0 ? assumptions.join('\n') : '_Brak jawnych założeń._'}

## Argumenty za

${extractPros(gen)}

## Argumenty przeciw

${extractCons(skeptic)}

## Ukryte ryzyka

${risks.length > 0 ? risks.map(r => `- ${r}`).join('\n') : '_Brak zidentyfikowanych ukrytych ryzyk._'}

## Pytania otwarte

${extractOpenQuestions(skeptic, pragmatist)}

## Alternatywy

${extractAlternatives(gen)}

## Minimalny eksperyment

${pragmatist ? extractMinExperiment(pragmatist) : '_Brak propozycji eksperymentu._'}

## Rekomendacja

${recommendation || '_Brak rekomendacji od Decydenta._'}

## Status

**${status || 'NEEDS_EVIDENCE'}**

## Następny krok

${nextStep || '_Brak wskazanego następnego kroku._'}
`;

  return memo;
}

function extractRisks(text) {
  const lines = text.split('\n').filter(l => l.trim());
  return lines
    .filter(l => /^[•\-*]/.test(l.trim()))
    .map(l => l.replace(/^[•\-*]\s*/, '').replace(/\*\*/g, ''))
    .slice(0, 7);
}

function extractDecision(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const statusMatch = text.match(/\*\*Status:\*\*\s*(GO|REVISE|NO-GO|NEEDS_EVIDENCE)/i);
  const status = statusMatch ? statusMatch[1].toUpperCase() : 'NEEDS_EVIDENCE';

  const recLines = lines.filter(l => !/^#/.test(l) && l.trim());
  const recommendation = recLines.slice(0, 3).join(' ');

  const nextMatch = text.match(/nast(ę|e)pn(y|ą|ich) krok/i);
  let nextStep = '';
  if (nextMatch) {
    const idx = lines.findIndex(l => l.toLowerCase().includes('następn'));
    if (idx >= 0) nextStep = lines.slice(idx).join(' ').replace(/\*\*/g, '');
  }

  return { status, recommendation, nextStep };
}

function extractPros(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const pros = lines.filter(l => /za|plus|korzy|no.*[Tt]ak/i.test(l) && /^[•\-*]/.test(l.trim()));
  return pros.length > 0 ? pros.slice(0, 5).join('\n') : '_Brak wyraźnych argumentów za._';
}

function extractCons(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const cons = lines.filter(l => /przeciw|ryzyk|słab|problem|wad/i.test(l) && /^[•\-*]/.test(l.trim()));
  return cons.length > 0 ? cons.slice(0, 5).join('\n') : '_Brak wyraźnych argumentów przeciw._';
}

function extractOpenQuestions(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const questions = lines.filter(l => /\?|nie.*wiemy|uncertain|open/i.test(l));
  return questions.length > 0 ? questions.slice(0, 5).join('\n') : '_Brak zidentyfikowanych pytań otwartych._';
}

function extractAlternatives(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const alts = lines.filter(l => /wariant|alternative|opcja|scenariusz/i.test(l) && /^[•\-*]/.test(l.trim()));
  return alts.length > 0 ? alts.slice(0, 4).join('\n') : '_Brak wyraźnie zdefiniowanych alternatyw._';
}

function extractMinExperiment(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const exp = lines.filter(l => /eksperyment|spike|pilot|test|mvp/i.test(l));
  return exp.length > 0 ? exp[0] : '_Brak propozycji._';
}
