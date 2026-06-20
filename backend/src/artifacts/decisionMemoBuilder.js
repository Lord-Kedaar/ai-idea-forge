import { AGENT_DEFINITIONS } from '../agents/agentDefinitions.js';
import { stripMarkdownNoise } from '../utils/textGuards.js';

const AGENT_ORDER = ['generator', 'skeptic', 'pragmatist', 'redteam', 'editor', 'decider'];
const MAX_ITEM_LENGTH = 220;
const MEMO_COPY = {
  pl: {
    title: 'DECISION MEMO', problem: 'Problem', context: 'Kontekst', constraints: 'Ograniczenia',
    proposal: 'Propozycja', keyFindings: 'Kluczowe ustalenia', risks: 'Ryzyka i braki danych',
    alternatives: 'Alternatywy', minimumExperiment: 'Minimalny eksperyment', recommendation: 'Rekomendacja',
    status: 'Status', nextStep: 'Następny krok', noProblem: '_Brak problemu._',
    noContext: '_Brak dodatkowego kontekstu._', noConstraints: '_Brak wskazanych ograniczeń._',
    noProposal: '_Brak propozycji._', noFindings: '_Brak ustaleń._', noRisks: '_Brak dodatkowych ryzyk._',
    noAlternatives: '_Brak alternatyw._', noExperiment: '_Brak eksperymentu._',
    noRecommendation: '_Brak rekomendacji._', noNextStep: '_Brak następnego kroku._',
  },
  en: {
    title: 'DECISION MEMO', problem: 'Problem', context: 'Context', constraints: 'Constraints',
    proposal: 'Proposal', keyFindings: 'Key findings', risks: 'Risks and data gaps',
    alternatives: 'Alternatives', minimumExperiment: 'Minimum experiment', recommendation: 'Recommendation',
    status: 'Status', nextStep: 'Next step', noProblem: '_No problem provided._',
    noContext: '_No additional context provided._', noConstraints: '_No constraints provided._',
    noProposal: '_No proposal available._', noFindings: '_No findings available._',
    noRisks: '_No additional risks._', noAlternatives: '_No alternatives available._',
    noExperiment: '_No experiment available._', noRecommendation: '_No recommendation available._',
    noNextStep: '_No next step available._',
  },
  de: {
    title: 'DECISION MEMO', problem: 'Problem', context: 'Kontext', constraints: 'Einschränkungen',
    proposal: 'Vorschlag', keyFindings: 'Wichtigste Erkenntnisse', risks: 'Risiken und Datenlücken',
    alternatives: 'Alternativen', minimumExperiment: 'Minimalexperiment', recommendation: 'Empfehlung',
    status: 'Status', nextStep: 'Nächster Schritt', noProblem: '_Kein Problem angegeben._',
    noContext: '_Kein zusätzlicher Kontext angegeben._', noConstraints: '_Keine Einschränkungen angegeben._',
    noProposal: '_Kein Vorschlag verfügbar._', noFindings: '_Keine Erkenntnisse verfügbar._',
    noRisks: '_Keine zusätzlichen Risiken._', noAlternatives: '_Keine Alternativen verfügbar._',
    noExperiment: '_Kein Experiment verfügbar._', noRecommendation: '_Keine Empfehlung verfügbar._',
    noNextStep: '_Kein nächster Schritt verfügbar._',
  },
};

function memoCopy(language) {
  return MEMO_COPY[['en', 'de', 'pl'].includes(language) ? language : 'pl'];
}



function truncate(text, max = MAX_ITEM_LENGTH) {
  const clean = stripMarkdownNoise(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trim() + '…';
}

function safeJsonParse(text) {
  if (!text) return null;
  const raw = text.trim();
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function splitFallbackFindings(text) {
  const rawLines = String(text || '')
    .replace(/\r\n/g, '\n')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^#{1,6}\s+/.test(line))
    .filter((line) => !/^```/.test(line))
    .filter((line) => !/^[-_]{3,}$/.test(line))
    .filter((line) => !/^\|.*\|$/.test(line))
    .filter((line) => !/\|\s*[-:]{2,}\s*\|/.test(line))
    .filter((line) => !/\bDECISION_MEMO\.md\b/i.test(line))
    .filter((line) => !/^\{\s*$|^\}\s*$|^\[\s*$|^\]\s*,?$/.test(line))
    .filter((line) => !/^"?(summary|findings|risks|recommendation|status)"?\s*[:[]/i.test(line))
    .filter((line) => !/^json\b/i.test(line));

  const clean = stripMarkdownNoise(rawLines.join('\n'));
  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.replace(/^[-•*]\s*/, '').trim())
    .filter((sentence) => sentence.length >= 8)
    .filter((sentence) => !/[{}[\]"|]{2,}/.test(sentence))
    .filter((sentence) => !/^(Temat|Problem|Kontekst|Ograniczenia|Status)\b/i.test(sentence))
    .map((sentence) => truncate(sentence))
    .slice(0, 5);

  if (sentences.length) return sentences;

  return rawLines
    .map((line) => stripMarkdownNoise(line))
    .map((line) => line.replace(/^"|",?$/g, '').trim())
    .filter((line) => line.length >= 8)
    .filter((line) => !/[{}[\]"|]{2,}/.test(line))
    .map((line) => truncate(line))
    .slice(0, 5);
}

function normalizeAgentOutput(agentId, output) {
  const parsed = safeJsonParse(output);
  if (parsed && typeof parsed === 'object') {
    return {
      agent: agentId,
      name: AGENT_DEFINITIONS[agentId]?.name || agentId,
      summary: truncate(parsed.summary || ''),
      findings: Array.isArray(parsed.findings) ? parsed.findings.map((x) => truncate(x)).filter(Boolean).slice(0, 5) : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks.map((x) => truncate(x, 180)).filter(Boolean).slice(0, 3) : [],
      recommendation: truncate(parsed.recommendation || '', 260),
      status: normalizeStatus(parsed.status),
    };
  }

  const findings = splitFallbackFindings(output);
  return {
    agent: agentId,
    name: AGENT_DEFINITIONS[agentId]?.name || agentId,
    summary: findings[0] || `_Brak użytecznego outputu od agenta ${agentId}._`,
    findings: findings.slice(1, 5),
    risks: [],
    recommendation: '',
    status: 'NEEDS_EVIDENCE',
  };
}

function normalizeStatus(status) {
  const value = String(status || '').toUpperCase().replace('-', '_');
  if (['GO', 'REVISE', 'NO_GO', 'NEEDS_EVIDENCE'].includes(value)) return value;
  return 'NEEDS_EVIDENCE';
}

function bulletList(items, empty = '_Brak danych._') {
  const clean = (items || []).map((item) => truncate(item)).filter(Boolean);
  if (!clean.length) return empty;
  return clean.map((item) => `- ${item}`).join('\n');
}

function agentSection(result) {
  return [
    `### ${result.name}`,
    '',
    result.summary || '_Brak podsumowania._',
    '',
    '**Ustalenia**',
    bulletList(result.findings),
    '',
    '**Ryzyka / braki danych**',
    bulletList(result.risks, '_Brak dodatkowych ryzyk._'),
    '',
    result.recommendation ? `**Rekomendacja agenta:** ${result.recommendation}` : '',
  ].filter((line) => line !== '').join('\n');
}

function pickFirst(results, agentId, field) {
  return results.find((r) => r.agent === agentId)?.[field] || '';
}

function collect(results, field, limit) {
  return results.flatMap((r) => r[field] || []).filter(Boolean).slice(0, limit);
}

function chooseDecision(results) {
  const decider = results.find((r) => r.agent === 'decider');
  if (decider?.recommendation) return decider;
  const editor = results.find((r) => r.agent === 'editor');
  return editor || results[results.length - 1];
}

export function buildDecisionMemo(state) {
  const copy = memoCopy(state.language);
  const outputs = Object.fromEntries((state.stages || []).map((stage) => [stage.agent, stage.output || '']));
  const results = AGENT_ORDER
    .filter((agentId) => outputs[agentId])
    .map((agentId) => normalizeAgentOutput(agentId, outputs[agentId]));
  const decision = chooseDecision(results) || { status: 'NEEDS_EVIDENCE', recommendation: '' };
  const risks = collect(results, 'risks', 8);
  const findings = collect(results, 'findings', 10);

  return `# ${copy.title}

## ${copy.problem}
${truncate(state.idea || copy.noProblem, 600)}

## ${copy.context}
${state.context ? truncate(state.context, 900) : copy.noContext}

## ${copy.constraints}
${state.constraints ? truncate(state.constraints, 700) : copy.noConstraints}

## ${copy.proposal}
${pickFirst(results, 'generator', 'summary') || copy.noProposal}

## ${copy.keyFindings}
${bulletList(findings, copy.noFindings)}

## ${copy.risks}
${bulletList(risks, copy.noRisks)}

## ${copy.alternatives}
${pickFirst(results, 'skeptic', 'summary') || copy.noAlternatives}

## ${copy.minimumExperiment}
${pickFirst(results, 'pragmatist', 'recommendation') || copy.noExperiment}

## ${copy.recommendation}
${decision.recommendation || copy.noRecommendation}

## ${copy.status}
${decision.status || 'NEEDS_EVIDENCE'}

## ${copy.nextStep}
${decision.recommendation || copy.noNextStep}
`;
}
