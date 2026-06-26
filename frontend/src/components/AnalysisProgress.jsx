import { useEffect, useState } from 'react';
import { Square, Loader2, FileText } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { AGENT_META } from '../workflows';
import { cn } from '../utils';

const FINAL_STATUSES = new Set(['completed', 'success', 'failed', 'cancelled']);

function elapsedSeconds(startedAt) {
  if (!startedAt) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
}

function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * AnalysisProgress — live status card for a run.
 * - status-dot with animate-pulse while running
 * - badge-status with data-state colors
 * - localized agent name + status
 * - elapsed timer ticking every 1s while not final
 * - progress counter (completed/total)
 * - stop button (while not final) + Go-to-Results button (on success)
 */
export function AnalysisProgress({ run, onStop, stopping, onGoToMemo }) {
  const { t } = useI18n();
  const [tick, setTick] = useState(0);

  if (!run) return null;

  const status = run.status || 'pending';
  const isFinal = FINAL_STATUSES.has(status);
  const stages = Array.isArray(run.stages) ? run.stages : [];
  const completed = stages.filter((s) => s.status === 'completed' || s.status === 'success').length;
  const elapsed = formatElapsed(elapsedSeconds(run.startedAt || run.createdAt) + tick);

  useEffect(() => {
    if (isFinal) return undefined;
    const timer = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [isFinal]);

  const canStop = !isFinal;
  const canGoToMemo = (status === 'completed' || status === 'success') && onGoToMemo;

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {t('analysisStatus')}
          </h2>
          <span className="badge-status" data-state={status}>
            <span className="status-dot" data-state={status} />
            {t(`status.${status}`)}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
          <span>
            <span className="text-muted-foreground/70">{t('progress')}:</span>{' '}
            <span className="text-foreground tabular-nums">{completed}/{stages.length}</span>
          </span>
          <span>
            <span className="text-muted-foreground/70">{t('elapsed')}:</span>{' '}
            <span className="text-foreground tabular-nums">{elapsed}</span>
          </span>
        </div>
      </div>

      <div className="card-body space-y-3">
        {stages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('agentNoData', { defaultValue: 'Brak etapów.' })}
          </p>
        ) : (
          <ol className="space-y-1.5">
            {stages.map((stage) => {
              const stageStatus = stage.status || 'pending';
              return (
                <li
                  key={stage.agent}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-md border border-border bg-background/40 px-3 py-2',
                    stageStatus === 'running' && 'border-foreground/20',
                    stageStatus === 'failed' && 'border-destructive/40'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="status-dot shrink-0" data-state={stageStatus} />
                    <span className="text-sm font-medium text-foreground truncate">
                      {t(`agent.${stage.agent}.name`, { defaultValue: stage.agent })}
                    </span>
                  </div>
                  <span className="badge-status shrink-0" data-state={stageStatus}>
                    {stageStatus === 'running' && <Loader2 className="h-3 w-3 animate-spin" />}
                    {t(`status.${stageStatus}`, { defaultValue: stageStatus })}
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        {run.error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">
            {run.error}
          </p>
        )}

        {canStop && onStop && (
          <button
            type="button"
            className="btn btn-secondary btn-sm w-full mt-2"
            onClick={onStop}
            disabled={stopping}
          >
            {stopping ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Square className="h-3.5 w-3.5" />
            )}
            {stopping ? t('stoppingButton') : t('stopRun')}
          </button>
        )}

        {canGoToMemo && (
          <button
            type="button"
            className="btn btn-primary btn-sm w-full mt-2"
            onClick={onGoToMemo}
          >
            <FileText className="h-3.5 w-3.5" />
            {t('goToResults', { defaultValue: 'Go to results' })}
          </button>
        )}
      </div>
    </div>
  );
}
