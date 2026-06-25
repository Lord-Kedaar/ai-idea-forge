import { Loader2, Square, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { cn } from '../utils';

const STATUS_ICON = {
  running: Loader2,
  pending: Loader2,
  completed: CheckCircle2,
  success: CheckCircle2,
  failed: XCircle,
  cancelled: AlertCircle,
};

const STATUS_TONE = {
  running: 'text-foreground',
  pending: 'text-muted-foreground',
  completed: 'text-emerald-500',
  success: 'text-emerald-500',
  failed: 'text-destructive',
  cancelled: 'text-muted-foreground',
};

/**
 * AnalysisProgress — show stages of the current run, with stop button.
 */
export function AnalysisProgress({ run, onStop, stopping }) {
  const { t } = useI18n();
  if (!run) return null;

  const status = run.status || 'pending';
  const stages = Array.isArray(run.stages) ? run.stages : [];
  const Icon = STATUS_ICON[status] || Loader2;
  const tone = STATUS_TONE[status] || 'text-foreground';
  const isFinal = ['completed', 'success', 'failed', 'cancelled'].includes(status);
  const spinning = status === 'running' || status === 'pending';

  // Localize the status text via flat key `statusLabel.<status>`; fall back to raw status
  const statusText = t(`statusLabel.${status}`) !== `statusLabel.${status}` ? t(`statusLabel.${status}`) : status;

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', tone, spinning && 'animate-spin')} aria-hidden="true" />
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {t('analysisStatus')}: <span className={cn('font-normal', tone)}>{statusText}</span>
          </h2>
        </div>
        {!isFinal && onStop && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onStop}
            disabled={stopping}
          >
            <Square className="h-3.5 w-3.5" /> {t('stop', { defaultValue: 'Zatrzymaj' })}
          </button>
        )}
      </div>
      <div className="card-body space-y-2">
        {stages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak etapów.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {stages.map((stage, i) => {
              const stageStatus = stage.status || 'pending';
              const StageIcon = STATUS_ICON[stageStatus] || Loader2;
              const stageTone = STATUS_TONE[stageStatus] || 'text-muted-foreground';
              const stageSpin = stageStatus === 'running' || stageStatus === 'pending';
              return (
                <li key={stage.agent || i} className="flex items-center gap-2">
                  <StageIcon
                    className={cn('h-3.5 w-3.5 shrink-0', stageTone, stageSpin && 'animate-spin')}
                    aria-hidden="true"
                  />
                  <span className="text-foreground/90">{stage.agent}</span>
                  <span className="text-xs text-muted-foreground">
                    — {t(`statusLabel.${stageStatus}`) !== `statusLabel.${stageStatus}` ? t(`statusLabel.${stageStatus}`) : stageStatus}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {run.error && (
          <p className="mt-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">
            {run.error}
          </p>
        )}
      </div>
    </div>
  );
}
