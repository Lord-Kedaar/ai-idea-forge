import { useI18n } from '../i18n/I18nProvider';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';

const NAV_LABEL_KEYS = {
  idea: 'bc.idea',
  analysis: 'bc.analysis',
  memo: 'bc.memo',
  history: 'bc.history',
  settings: 'bc.settings',
  help: 'bc.help',
};

function NavBreadcrumb({ active }) {
  const { t } = useI18n();
  const labelKey = NAV_LABEL_KEYS[active] || 'bc.idea';
  return (
    <nav className="topbar-breadcrumb flex items-center gap-1.5 text-sm text-muted-foreground min-w-0" aria-label={t('bc.workspace')}>
      <span className="hidden sm:inline truncate">{t('bc.workspace')}</span>
      <span className="hidden sm:inline opacity-40" aria-hidden="true">/</span>
      <span className="text-foreground font-medium truncate">{t(labelKey)}</span>
    </nav>
  );
}

export function HeaderBar({ rightSlot, active }) {
  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        {active && <NavBreadcrumb active={active} />}
      </div>
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {rightSlot}
        <LanguageSwitcher />
        <ThemeToggle />
        <div className="user-chip hidden sm:inline-flex items-center gap-2 pl-2 ml-1 border-l border-border h-7" aria-label={String('Radosław')}>
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-foreground text-[10px] font-semibold border border-border" aria-hidden="true">RP</div>
          <span className="text-xs text-muted-foreground pr-1 hidden md:inline">Radosław</span>
        </div>
      </div>
    </header>
  );
}