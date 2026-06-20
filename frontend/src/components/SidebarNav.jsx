import { Lightbulb, History, Activity, FileText, Settings, HelpCircle } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

const NAV = [
  { id: 'idea', icon: Lightbulb, key: 'nav.idea' },
  { id: 'analysis', icon: Activity, key: 'nav.analysis' },
  { id: 'memo', icon: FileText, key: 'nav.memo' },
  { id: 'history', icon: History, key: 'nav.history' },
  { id: 'settings', icon: Settings, key: 'nav.settings' },
  { id: 'help', icon: HelpCircle, key: 'nav.help' },
];

export function SidebarNav({ active, onChange }) {
  const { t } = useI18n();
  return (
    <aside className="flex flex-col h-full">
      {/* Brand — mirrors OpenDesign sidebar-brand */}
      <div className="sidebar-brand flex items-center gap-2.5 px-3 pt-4 pb-3">
        <img
          src="/icons/icon_dark_theme.svg"
          alt=""
          aria-hidden="true"
          data-theme-icon="dark"
          className="brand-mark"
        />
        <img
          src="/icons/icon_light_theme.svg"
          alt=""
          aria-hidden="true"
          data-theme-icon="light"
          className="brand-mark"
        />
        <div className="min-w-0">
          <div className="text-sm font-semibold tracking-tight text-foreground leading-none">Idea Forge</div>
          <div className="text-[11px] text-muted-foreground mt-1 tracking-wide truncate">
            {t('brandSub')}
          </div>
        </div>
      </div>

      {/* Primary group — Warsztat */}
      <div className="sidebar-group-label">{t('nav.workspace')}</div>
      <nav className="flex flex-col gap-0.5 px-2" aria-label="Primary">
        {NAV.slice(0, 3).map(({ id, icon: Icon, key }) => (
          <button
            key={id}
            type="button"
            className="nav-item"
            data-active={active === id}
            aria-current={active === id ? 'page' : undefined}
            onClick={() => onChange(id)}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{t(key)}</span>
          </button>
        ))}
      </nav>

      {/* Library group — Biblioteka (Historia only — Szablony/Agenci intentionally removed per product decision) */}
      <div className="sidebar-group-label">{t('nav.library')}</div>
      <nav className="flex flex-col gap-0.5 px-2" aria-label="Library">
        {NAV.slice(3, 4).map(({ id, icon: Icon, key }) => (
          <button
            key={id}
            type="button"
            className="nav-item"
            data-active={active === id}
            aria-current={active === id ? 'page' : undefined}
            onClick={() => onChange(id)}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{t(key)}</span>
          </button>
        ))}
      </nav>

      {/* Footer — Settings/Help + privacy/about/copyright (OD parity) */}
      <div className="mt-auto px-2 pb-3">
        <nav className="flex flex-col gap-0.5" aria-label="Footer">
          {NAV.slice(4).map(({ id, icon: Icon, key }) => (
            <button
              key={id}
              type="button"
              className="nav-item"
              data-active={active === id}
              aria-current={active === id ? 'page' : undefined}
              onClick={() => onChange(id)}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{t(key)}</span>
            </button>
          ))}
        </nav>
        <div className="separator my-3" role="separator" aria-hidden="true" />
        <a className="sidebar-link" href="#privacy">{t('footer.privacy')}</a>
        <a className="sidebar-link" href="#about">{t('footer.about')}</a>
        <p className="px-3 pt-1 text-[11px] text-muted-foreground/70">{t('footer.copyright')}</p>
      </div>
    </aside>
  );
}