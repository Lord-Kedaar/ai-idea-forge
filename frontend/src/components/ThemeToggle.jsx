import { Moon, Sun } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { useTheme } from '../useTheme';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { t } = useI18n();
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={t('themeToggleLabel')}
      aria-pressed={isDark}
      title={t('themeToggleLabel')}
      onClick={toggle}
    >
      {isDark ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}