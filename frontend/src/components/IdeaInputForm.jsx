import { useState } from 'react';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { WorkflowSelector } from './WorkflowSelector';
import { cn } from '../utils';

export function IdeaInputForm({
  idea, setIdea,
  workflowType, setWorkflowType, workflows,
  context, setContext,
  constraints, setConstraints,
  extraInstructions, setExtraInstructions,
  lengthPref, setLengthPref,
  criticismLevel, setCriticismLevel,
  priority, setPriority,
  canStart, submitting, submitError,
  onStart, disabled,
}) {
  const { t } = useI18n();
  const [extrasOpen, setExtrasOpen] = useState(false);
  const ideaEmpty = !idea.trim();
  const isStarting = submitting;

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{t('newRun')}</h2>
      </div>

      <div className="card-body space-y-5">
        <div>
          <label htmlFor="idea" className="form-label">{t('ideaLabel')}</label>
          <textarea
            id="idea"
            className="textarea"
            rows={6}
            maxLength={1000}
            placeholder={t('ideaPlaceholder')}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            disabled={disabled}
          />
          <div className="form-help flex items-center justify-between">
            <span className={cn(ideaEmpty && 'text-destructive')}>
              {ideaEmpty ? t('ideaRequiredError') : ''}
            </span>
            <span className="tabular-nums">{t('ideaCounter', { count: idea.length })}</span>
          </div>
        </div>

        <WorkflowSelector
          workflows={workflows}
          value={workflowType}
          onChange={setWorkflowType}
          disabled={disabled}
        />

        <div>
          <label htmlFor="context" className="form-label">{t('contextLabel')}</label>
          <textarea
            id="context"
            className="textarea"
            rows={3}
            placeholder={t('contextPlaceholder')}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            disabled={disabled}
          />
        </div>

        <div>
          <label htmlFor="constraints" className="form-label">{t('constraintsLabel')}</label>
          <textarea
            id="constraints"
            className="textarea"
            rows={3}
            placeholder={t('constraintsPlaceholder')}
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="border-t border-border pt-4">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setExtrasOpen((v) => !v)}
            aria-expanded={extrasOpen}
            disabled={disabled}
          >
            {extrasOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            {extrasOpen ? t('hide') : t('show')} {t('extraOptions')}
          </button>

          {extrasOpen && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SelectField id="lengthPref" label={t('lengthLabel')} value={lengthPref} onChange={setLengthPref} disabled={disabled} options={['short', 'medium', 'long']} t={t} />
                <SelectField id="criticismLevel" label={t('criticismLabel')} value={criticismLevel} onChange={setCriticismLevel} disabled={disabled} options={['shallow', 'balanced', 'deep']} t={t} />
                <SelectField id="priority" label={t('priorityLabel')} value={priority} onChange={setPriority} disabled={disabled} options={['low', 'balanced', 'high']} t={t} />
              </div>
              <div>
                <label htmlFor="extraInstructions" className="form-label">{t('extraInstructionsLabel')}</label>
                <textarea
                  id="extraInstructions"
                  className="textarea"
                  rows={3}
                  placeholder={t('extraInstructionsPlaceholder')}
                  value={extraInstructions}
                  onChange={(e) => setExtraInstructions(e.target.value)}
                  disabled={disabled}
                />
              </div>
            </div>
          )}
        </div>

        {submitError && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {submitError}
          </div>
        )}
      </div>
    </div>
  );
}

function SelectField({ id, label, value, onChange, options, disabled, t }) {
  return (
    <div>
      <label htmlFor={id} className="form-label">{label}</label>
      <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        {options.map((option) => (
          <option key={option} value={option}>{t(option)}</option>
        ))}
      </select>
    </div>
  );
}