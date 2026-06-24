import { Lightbulb } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

/**
 * AnalysisExplainer — info card explaining the active workflow.
 * Shows workflow id, name (from i18n), and a description.
 */
export function AnalysisExplainer({ workflow }) {
  const { t } = useI18n();
  const id = workflow?.id;

  if (!id) {
    return (
      <div className="card">
        <div className="card-body text-sm text-muted-foreground">
          Wybierz tryb pracy, żeby zobaczyć opis.
        </div>
      </div>
    );
  }

  const name = t(`workflow.${id}.name`, { defaultValue: id });
  const description = t(`workflow.${id}.description`, { defaultValue: '' });
  const agents = Array.isArray(workflow.agents) ? workflow.agents : [];

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-secondary text-foreground/80">
            <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            {name}
          </h3>
        </div>
      </div>
      <div className="card-body space-y-3 text-sm text-muted-foreground">
        {description && <p>{description}</p>}
        {agents.length > 0 && (
          <p>
            <span className="font-medium text-foreground/80">Agenci:</span>{' '}
            {agents.join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}
