import { FileText, AlertCircle } from 'lucide-react';
import { renderMarkdown } from '../markdown';

/**
 * DecisionMemoPanel — shows the final decision memo (rendered markdown)
 * for the current run. Surfaces memoError inline if the fetch failed.
 */
export function DecisionMemoPanel({ run, memo, memoError }) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-secondary text-foreground/80">
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Decision memo
          </h2>
        </div>
      </div>
      <div className="card-body space-y-3">
        {!run && (
          <p className="text-sm text-muted-foreground">
            Brak aktywnego biegu analizy.
          </p>
        )}
        {memoError && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{memoError}</span>
          </div>
        )}
        {memo && (
          <div
            className="prose prose-invert max-w-none text-sm leading-relaxed text-foreground/90"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(memo) }}
          />
        )}
        {!memo && !memoError && run && (
          <p className="text-sm text-muted-foreground">
            Trwa generowanie memo…
          </p>
        )}
      </div>
    </div>
  );
}
