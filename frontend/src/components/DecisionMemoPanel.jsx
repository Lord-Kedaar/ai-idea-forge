import { useMemo } from 'react';
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  Target,
  Lightbulb,
  Shield,
  AlertTriangle,
  GitBranch,
  FlaskConical,
  Sparkles,
  Clock,
  Cpu,
  ArrowRight,
} from 'lucide-react';
import { renderMarkdown } from '../markdown';
import { useI18n } from '../i18n/I18nProvider';
import { cn } from '../utils';

/**
 * Parse a decision-memo markdown string into a list of { title, body } sections.
 * Memo builder emits 11 `##` sections: Problem, Context, Constraints, Proposal,
 * Key findings, Risks, Alternatives, Minimum experiment, Recommendation, Status, Next step.
 * We strip the leading `# DECISION MEMO` H1 and group everything else by H2.
 */
function parseMemoSections(md) {
  if (!md) return [];
  const lines = md.split('\n');
  const sections = [];
  let current = null;
  let frontmatter = [];

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.*)/);
    const h1 = line.match(/^#\s+(.*)/);
    if (h1) {
      // Skip H1 title — the hero badge replaces it.
      continue;
    }
    if (h2) {
      if (current) sections.push(current);
      current = { title: h2[1].trim(), body: [] };
    } else if (current) {
      current.body.push(line);
    } else {
      frontmatter.push(line);
    }
  }
  if (current) sections.push(current);
  return { sections, frontmatter: frontmatter.join('\n').trim() };
}

const SECTION_META = [
  { key: 'Problem', icon: Target, tone: 'text-sky-500', accent: 'border-sky-500/30' },
  { key: 'Context', icon: Lightbulb, tone: 'text-amber-500', accent: 'border-amber-500/30' },
  { key: 'Constraints', icon: Shield, tone: 'text-slate-500', accent: 'border-slate-500/30' },
  { key: 'Proposal', icon: Sparkles, tone: 'text-violet-500', accent: 'border-violet-500/30' },
  { key: 'Key findings', icon: CheckCircle2, tone: 'text-emerald-500', accent: 'border-emerald-500/30' },
  { key: 'Risks', icon: AlertTriangle, tone: 'text-rose-500', accent: 'border-rose-500/30' },
  { key: 'Alternatives', icon: GitBranch, tone: 'text-cyan-500', accent: 'border-cyan-500/30' },
  { key: 'Minimum experiment', icon: FlaskConical, tone: 'text-fuchsia-500', accent: 'border-fuchsia-500/30' },
];

const RECOMMEND_TONE = {
  GO: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30',
  NO_GO: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-rose-500/30',
  NEEDS_EVIDENCE: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/30',
};

function recommendationTone(status) {
  if (!status) return 'bg-secondary text-foreground ring-border';
  const norm = status.toUpperCase();
  if (norm === 'GO' || norm === 'PROCEED' || norm === 'YES') return RECOMMEND_TONE.GO;
  if (norm === 'NO_GO' || norm === 'NO-GO' || norm === 'STOP') return RECOMMEND_TONE.NO_GO;
  if (norm === 'NEEDS_EVIDENCE' || norm === 'NEEDS EVIDENCE' || norm === 'MAYBE') return RECOMMEND_TONE.NEEDS_EVIDENCE;
  return 'bg-secondary text-foreground ring-border';
}

function formatElapsed(iso) {
  if (!iso) return null;
  const start = new Date(iso).getTime();
  if (Number.isNaN(start)) return null;
  const ms = Date.now() - start;
  if (ms < 0) return null;
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${min}m ${rem}s`;
}

/**
 * DecisionMemoPanel — renders the decision memo as a hero card with a
 * recommendation badge, then grid of section cards with Lucide icons.
 */
export function DecisionMemoPanel({ run, memo, memoError }) {
  const { t, lang } = useI18n();
  const parsed = useMemo(() => parseMemoSections(memo), [memo]);

  // Find Recommendation / Status / Next step from parsed sections (any language).
  const recommendSection = parsed.sections?.find(
    (s) => /^(Rekomendacja|Recommendation|Empfehlung)$/i.test(s.title)
  );
  const statusSection = parsed.sections?.find(
    (s) => /^(Status|Status decyzji|Decision status|Entscheidungsstatus)$/i.test(s.title)
  );
  const nextStepSection = parsed.sections?.find(
    (s) => /^(Następny krok|Nast\u0119pny krok|Next step|Nächster Schritt)$/i.test(s.title)
  );

  // Everything else is a "context" section (problem, context, constraints, ...).
  const contextSections = (parsed.sections || []).filter(
    (s) => s !== recommendSection && s !== statusSection && s !== nextStepSection
  );

  const elapsed = formatElapsed(run?.completedAt || run?.startedAt);

  return (
    <div className="space-y-6">
      {/* ─── Hero card ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-violet-500/10 via-background to-emerald-500/10">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-emerald-500" />
        <div className="space-y-5 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/70 px-2.5 py-1 font-medium text-foreground/80 ring-1 ring-border">
              <FileText className="h-3 w-3" aria-hidden="true" />
              {t('memoHeroBadge')}
            </span>
            {run?.language && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/70 px-2.5 py-1 font-medium uppercase text-foreground/80 ring-1 ring-border">
                {run.language}
              </span>
            )}
            {run?.workflowType && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/70 px-2.5 py-1 font-medium text-foreground/80 ring-1 ring-border">
                <Cpu className="h-3 w-3" aria-hidden="true" />
                {run.workflowType}
              </span>
            )}
            {Array.isArray(run?.stages) && run.stages.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/70 px-2.5 py-1 font-medium text-foreground/80 ring-1 ring-border">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                {run.stages.length} {t('memoMetaAgents')}
              </span>
            )}
            {elapsed && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/70 px-2.5 py-1 font-medium text-foreground/80 ring-1 ring-border">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {elapsed}
              </span>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {t('decisionMemo')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('memoHeroSubtitle')}</p>
          </div>

          {/* Recommendation / Decision status badges */}
          {(recommendSection || statusSection) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {recommendSection && (
                <div className="rounded-lg border border-border bg-card/60 p-4">
                  <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    <Target className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('memoRecommendationLabel')}
                  </div>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">
                    {recommendSection.body.join('\n').trim()}
                  </p>
                </div>
              )}
              {statusSection && (
                <div className="rounded-lg border border-border bg-card/60 p-4">
                  <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('memoStatusLabel')}
                  </div>
                  <div className="mt-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-semibold uppercase tracking-wider ring-1',
                        recommendationTone(statusSection.body.join(' ').trim())
                      )}
                    >
                      {statusSection.body.join(' ').trim()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Next step — highlighted call-to-action */}
          {nextStepSection && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                {t('memoNextStepLabel')}
              </div>
              <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">
                {nextStepSection.body.join('\n').trim()}
              </p>
            </div>
          )}

        </div>
      </div>

      {/* ─── Error / empty / loading states ──────────────────────────── */}
      {memoError && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{memoError}</span>
        </div>
      )}

      {!run && (
        <p className="text-sm text-muted-foreground">{t('memoWaiting') || ''}</p>
      )}

      {!memo && !memoError && run && (
        <div className="rounded-md border border-dashed border-border bg-background/40 p-10 text-center text-sm text-muted-foreground">
          {t('analysisInProgress')}
        </div>
      )}

      {/* ─── Section cards ───────────────────────────────────────────── */}
      {contextSections.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {contextSections.map((section) => {
            const meta =
              SECTION_META.find((m) => m.key.toLowerCase() === section.title.toLowerCase()) || null;
            const Icon = meta?.icon || FileText;
            const tone = meta?.tone || 'text-muted-foreground';
            const accent = meta?.accent || 'border-border';
            return (
              <div
                key={section.title}
                className={cn(
                  'rounded-lg border bg-card p-4 transition-colors hover:bg-card/80',
                  accent
                )}
              >
                <div className="mb-2 flex items-center gap-2">
                  <Icon className={cn('h-4 w-4 shrink-0', tone)} aria-hidden="true" />
                  <h3 className="text-sm font-semibold tracking-tight text-foreground">
                    {section.title}
                  </h3>
                </div>
                <div
                  className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed text-foreground/85 prose-headings:text-foreground prose-headings:text-sm prose-headings:font-semibold prose-strong:text-foreground prose-li:my-0.5"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(section.body.join('\n').trim()),
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
