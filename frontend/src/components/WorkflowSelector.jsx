import { useI18n } from '../i18n/I18nProvider';
import { WorkflowCard } from './WorkflowCard';

/**
 * WorkflowSelector — grid of selectable workflow cards.
 * Renders a card per workflow, marks the active one, and emits onChange.
 */
export function WorkflowSelector({ workflows, value, onChange, disabled }) {
  const { t } = useI18n();
  if (!workflows || workflows.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-background/40 p-4 text-center text-sm text-muted-foreground">
        Brak dostępnych trybów pracy.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {workflows.map((workflow) => (
        <WorkflowCard
          key={workflow.id}
          workflow={workflow}
          selected={value === workflow.id}
          onSelect={(id) => !disabled && onChange?.(id)}
          disabled={disabled}
          t={t}
        />
      ))}
    </div>
  );
}
