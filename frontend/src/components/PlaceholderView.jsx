import { useI18n } from '../i18n/I18nProvider';
import { Sparkles } from 'lucide-react';

export function PlaceholderView({ kind }) {
  const { t } = useI18n();
  const titleKey = `placeholder.${kind}Title`;
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-secondary text-foreground/80">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <h2 className="text-base font-semibold tracking-tight text-foreground leading-none">
            {t(titleKey)}
          </h2>
        </div>
      </div>
      <div className="card-body">
        <div className="rounded-md border border-dashed border-border bg-background/40 p-10 text-center text-sm text-muted-foreground">
          {t('placeholder.comingSoon')}
        </div>
      </div>
    </div>
  );
}