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
    <aside className="hidden md:flex md:flex-col md:w-56 md:shrink-0 border-r border-border bg-background/40">
      <nav className="flex flex-col gap-1 p-3" aria-label="Primary">
        {NAV.map(({ id, icon: Icon, key }) => (
          <button
            key={id}
            type="button"
            className="nav-item"
            data-active={active === id}
            aria-current={active === id ? 'page' : undefined}
            onClick={() => onChange(id)}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t(key)}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}