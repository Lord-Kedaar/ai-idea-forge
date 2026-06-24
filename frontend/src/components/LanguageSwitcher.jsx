import { useI18n } from '../i18n/I18nProvider';

/**
 * LanguageSwitcher — three-way toggle (PL / EN / DE).
 * Persists choice in localStorage via I18nProvider.
 */
const LANGS = [
  { code: 'pl', label: 'PL' },
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
];

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex h-8 items-center rounded-md border border-border bg-secondary/40 text-[11px] font-medium tracking-wide"
    >
      {LANGS.map((l) => {
        const active = lang === l.code;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l.code)}
            aria-pressed={active}
            className={
              'h-full px-2 transition-colors ' +
              (active
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground')
            }
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
