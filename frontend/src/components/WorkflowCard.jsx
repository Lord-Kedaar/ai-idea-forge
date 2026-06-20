import {
  Lightbulb,
  ShieldQuestion,
  ShieldAlert,
  GitCompare,
  CheckCircle2,
  Workflow,
  Sparkles,
  Target,
  FilePenLine,
  BadgeCheck,
  Zap,
  TriangleAlert,
  Scale,
  Compass,
  Layers,
} from 'lucide-react';
import { cn } from '../utils';

const ICONS = {
  Lightbulb,
  ShieldQuestion,
  ShieldAlert,
  GitCompare,
  CheckCircle2,
  Workflow,
  Sparkles,
  Target,
  FilePenLine,
  BadgeCheck,
  Zap,
  TriangleAlert,
  Scale,
  Compass,
  Layers,
};

// Per-workflow icon map — each Tryb pracy gets a distinctive icon matching
// its meaning rather than a generic placeholder. Mirrors OD workflow cards.
const WORKFLOW_ICONS = {
  develop_idea: Sparkles,        // Rozwiń pomysł — generating/expanding
  critique_idea: ShieldQuestion, // Skrytykuj pomysł — questioning/critique
  premortem: ShieldAlert,        // Pre-mortem — risk/alert
  compare_variants: GitCompare,  // Porównaj warianty — comparison
  decision_memo: Zap,            // Szybka rekomendacja — fast decision
  full_analysis: Workflow,       // Pełna analiza — full pipeline
};

export function WorkflowCard({ workflow, selected, onSelect, disabled, t }) {
  const Icon = WORKFLOW_ICONS[workflow.id] || ICONS[workflow.icon] || Lightbulb;
  return (
    <button
      type="button"
      className={cn('workflow-card', selected && 'selected')}
      aria-pressed={selected}
      aria-label={t(`workflow.${workflow.id}.name`)}
      disabled={disabled}
      onClick={() => onSelect(workflow.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-foreground/80">
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <span className="text-sm font-semibold text-foreground truncate">
            {t(`workflow.${workflow.id}.name`)}
          </span>
        </div>
        <span className="badge shrink-0">{workflow.agents.length}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
        {t(`workflow.${workflow.id}.description`)}
      </p>
    </button>
  );
}