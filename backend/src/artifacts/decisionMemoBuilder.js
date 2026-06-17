/**
 * AI Idea Forge — Decision Memo Builder
 * Generates DECISION_MEMO.md from run state.
 */

import { AGENT_DEFINITIONS } from '../agents/agentDefinitions.js';

/**
 * Format raw agent output as a markdown section.
 * Wraps content in ### [Agent Name] and splits into paragraphs.
 */
function formatAgentOutput(agentName, content) {
  if (!content || !content.trim()) {
    return `_Brak outputu od ${agentName}._`;
  }
  const paragraphs = content
    .split(/\n\s*\n+/)
    .map(p => p.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(p => p.length > 0);
  if (paragraphs.length === 0) {
    return `_Brak tre\u015bci od ${agentName}._`;
  }
  const body = paragraphs.join('\n\n');
  return `### ${agentName}\n\n${body}`;
}

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
  const facts = skepticLines.filter(l => /^\*\*[Ff]akt/i.test(l) || /^[\u2022\u2023\u25E6\u2043\u2219\-] .*(?:jest|to|s\u0105|to)/.test(l));
  const assumptions = skepticLines.filter(l => /za\u0142o\u017ceni|assumption/i.test(l.toLowerCase()));
  const risks = redteam ? extractRisks(redteam) : [];

  // Extract recommendation from decider
  const { status, recommendation, nextStep } = extractDecision(decider);

  const contextSection = context ? `## Kontekst\n\n${context}\n\n` : '';
  const constraintsSection = constraints ? `## Ograniczenia\n\n${constraints}\n\n` : '';

  const memo = `# DECISION MEMO

## Problem

${idea}

${contextSection}${constraintsSection}## Propozycja

${formatAgentOutput('Generator', gen)}

## Analiza Sceptyka

${formatAgentOutput('Sceptyk', skeptic)}

## Perspektywa Pragmatyka

${formatAgentOutput('Pragmatyk', pragmatist)}

## Red Team \u2014 Analiza Ryzyk

${formatAgentOutput('Red Team', redteam)}

## Korekta Redaktora

${formatAgentOutput('Redaktor', editor)}

## Decyzja Decydenta

${formatAgentOutput('Decydent', decider)}

## Fakty

${facts.length > 0 ? facts.join('\n') : '_Brak wyra\u017Anie wskazanych fakt\u00F3w._'}

## Za\u0142o\u017Cenia

${assumptions.length > 0 ? assumptions.join('\n') : '_Brak jawnych za\u0142o\u017Ce\u0144._'}

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

## Nast\u0119pny krok

${nextStep || '_Brak wskazanego nast\u0119pnego kroku._'}
`;

  return memo;
}

function extractRisks(text) {
  const lines = text.split('\n').filter(l => l.trim());
  return lines
    .filter(l => /^[\u2022\u2023\u25E6\u2043\u2219\-*]/.test(l.trim()))
    .map(l => l.replace(/^[\u2022\u2023\u25E6\u2043\u2219\-*]\s*/, '').replace(/\*\*/g, ''))
    .slice(0, 7);
}

function extractDecision(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const statusMatch = text.match(/\*\*Status:\*\*\s*(GO|REVISE|NO-GO|NEEDS_EVIDENCE)/i);
  const status = statusMatch ? statusMatch[1].toUpperCase() : 'NEEDS_EVIDENCE';

  const recLines = lines.filter(l => !/^#/.test(l) && l.trim());
  const recommendation = recLines.slice(0, 3).join(' ');

  const nextMatch = text.match(/nast(p|\u0119)pn(y|\u0105|ich) krok/i);
  let nextStep = '';
  if (nextMatch) {
    const idx = lines.findIndex(l => l.toLowerCase().includes('nast\u0119pn'));
    if (idx >= 0) nextStep = lines.slice(idx).join(' ').replace(/\*\*/g, '');
  }

  return { status, recommendation, nextStep };
}

function extractPros(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const pros = lines.filter(l => /za|plus|korzy|no.*[Tt]ak/i.test(l) && /^[\u2022\u2023\u25E6\u2043\u2219\-*]/.test(l.trim()));
  return pros.length > 0 ? pros.slice(0, 5).join('\n') : '_Brak wyra\u017Anych argument\u00F3w za._';
}

function extractCons(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const cons = lines.filter(l => /przeciw|ryzyk|s\u0142ab|problem|wad/i.test(l) && /^[\u2022\u2023\u25E6\u2043\u2219\-*]/.test(l.trim()));
  return cons.length > 0 ? cons.slice(0, 5).join('\n') : '_Brak wyra\u017Anych argument\u00F3w przeciw._';
}

function extractOpenQuestions(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const questions = lines.filter(l => /\?|nie.*wiemy|uncertain|open/i.test(l));
  return questions.length > 0 ? questions.slice(0, 5).join('\n') : '_Brak zidentyfikowanych pyta\u0144 otwartych._';
}

function extractAlternatives(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const alts = lines.filter(l => /wariant|alternative|opcja|scenariusz/i.test(l) && /^[\u2022\u2023\u25E6\u2043\u2219\-*]/.test(l.trim()));
  return alts.length > 0 ? alts.slice(0, 4).join('\n') : '_Brak wyra\u017Anie zdefiniowanych alternatyw._';
}

function extractMinExperiment(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const exp = lines.filter(l => /eksperyment|spike|pilot|test|mvp/i.test(l));
  return exp.length > 0 ? exp[0] : '_Brak propozycji._';
}
