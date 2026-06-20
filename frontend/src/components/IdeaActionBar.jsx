import { Info, Loader2, ArrowRight, RotateCcw } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { cn } from '../utils';

/**
 * IdeaActionBar — sticky bottom strip shown only inside IdeaView.
 *
 * Sibling of the main content grid, NOT a child of IdeaInputForm — keeps the
 * visual rhythm: workspace grid scrolls above, action bar anchors the bottom
 * and spans the full main width.
 */
export function IdeaActionBar({
  selectedWorkflow,
  canStart,
  canClear,
  isStarting,
  submitError,
  onClear,
  onStart,
}) {
  const { t } = useI18n();
  const agentsCount = selectedWorkflow?.agents?.length ?? 0;
  const modeName = selectedWorkflow ? t(`workflow.${selectedWorkflow.id}.name`) : '—';

  return (
    <div
      className="shrink-0 border-t border-border-strong bg-background px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      role="region"
      aria-label={t('actionbar.label')}
    >
      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {t('actionbar.selected', { mode: modeName, count: agentsCount })}
          </span>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClear}
            disabled={!canClear}
            aria-label={t('actionbar.clear')}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('actionbar.clear')}</span>
          </button>
          <button
            type="button"
            className={cn('btn btn-primary h-10 px-5')}
            onClick={onStart}
            disabled={!canStart}
            aria-label={t('startButton')}
          >
            {isStarting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            <span>{isStarting ? t('startingButton') : t('startButton')}</span>
            {!isStarting && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </div>
      {submitError && (
        <div className="-mt-2 px-6 pb-3">
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {submitError}
          </div>
        </div>
      )}
    </div>
  );
}