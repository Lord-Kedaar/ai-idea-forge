import { useI18n } from '../i18n/I18nProvider';
import { AGENT_META, AGENT_ORDER } from '../workflows';
import { Sparkles, ShieldQuestion, Target, ShieldAlert, FilePenLine, BadgeCheck } from 'lucide-react';

const ICON = { Sparkles, ShieldQuestion, Target, ShieldAlert, FilePenLine, BadgeCheck };

/**
 * AnalysisExplainer — info card explaining the active workflow.
 * Renders per-agent cards (avatar icon, localized name, description) for each
 * agent in the workflow, plus a header summarizing mode + agent count.
 */
export function AnalysisExplainer({ workflow }) {
  const { t } = useI18n();
  const ids = workflow?.agents?.length ? workflow.agents : AGENT_ORDER;
  const modeName = workflow ? t(`workflow.${workflow.id}.name`) : null;

  if (!workflow) {
    return (
      <div className="card">
        <div className="card-body text-sm text-muted-foreground">
          {t('howItWorksBody')}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {t('howItWorksDynamic', { mode: modeName })}
          </h2>
          <span className="badge">
            {t('agentsCountDynamic', { count: ids.length })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {t(`workflow.${workflow.id}.description`)}
        </p>
      </div>
      <div className="card-body">
        <ol className="space-y-2">
          {ids.map((id, i) => {
            const meta = AGENT_META[id];
            const Icon = ICON[meta?.icon] || Sparkles;
            return (
              <li key={id} className="flex items-start gap-3 rounded-md border border-border bg-background/40 p-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-[11px] font-semibold tabular-nums text-foreground/80">
                  {i + 1}
                </div>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-foreground/80">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground">
                    {t(`agent.${id}.name`)}
                  </div>
                  <div className="text-xs text-muted-foreground leading-snug">
                    {t(`agent.${id}.description`)}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
