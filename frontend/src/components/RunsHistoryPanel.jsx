import { History, RefreshCw, Trash2, Eye } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

const STATUS_TONE = {
  running: 'text-amber-500',
  pending: 'text-muted-foreground',
  completed: 'text-emerald-500',
  success: 'text-emerald-500',
  failed: 'text-destructive',
  cancelled: 'text-muted-foreground',
};

/**
 * RunsHistoryPanel — list of past runs with open / delete / refresh actions.
 */
export function RunsHistoryPanel({ runs = [], onOpen, onDelete, onRefresh }) {
  const { t } = useI18n();
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-secondary text-foreground/80">
            <History className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {t('historyTitle', { defaultValue: 'Historia' })}
          </h2>
        </div>
        {onRefresh && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onRefresh} aria-label="Odśwież">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="card-body">
        {runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('historyEmpty', { defaultValue: 'Brak zapisanych analiz.' })}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {runs.map((run) => {
              const status = run.status || 'pending';
              const tone = STATUS_TONE[status] || 'text-muted-foreground';
              return (
                <li key={run.runId} className="flex items-center gap-3 py-2 text-sm">
                  <span className={'shrink-0 text-xs font-medium ' + tone}>{status}</span>
                  <span className="min-w-0 flex-1 truncate text-foreground/80">
                    {(run.idea || run.runId || '').toString().slice(0, 80)}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {run.createdAt ? new Date(run.createdAt).toLocaleString() : ''}
                  </span>
                  {onOpen && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => onOpen(run.runId)}
                      aria-label="Otwórz"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm text-destructive"
                      onClick={() => onDelete(run.runId)}
                      aria-label="Usuń"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
