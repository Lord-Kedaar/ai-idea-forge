import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * BackendStatus — banner shown when backend health is degraded or down.
 * Calls onRetry to re-fetch bootstrap data.
 */
export function BackendStatus({ down, error, onRetry }) {
  if (!down) return null;
  return (
    <div
      className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
      role="alert"
    >
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {typeof error === 'string' && error.length > 0
            ? error
            : 'Backend chwilowo niedostępny. Spróbuj ponownie za chwilę.'}
        </p>
      </div>
      {onRetry && (
        <button
          type="button"
          className="btn btn-secondary btn-sm shrink-0"
          onClick={onRetry}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Ponów
        </button>
      )}
    </div>
  );
}
