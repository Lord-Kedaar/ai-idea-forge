import { createContext, useContext, useState, useEffect } from 'react';
import en from './en.json';
import de from './de.json';
import pl from './pl.json';

const translations = { en, de, pl };

// Detect browser language, return 'en' | 'de' | 'pl'
function detectBrowserLang() {
  if (typeof navigator === 'undefined') return 'pl';
  const lang = (navigator.language || navigator.userLanguage || '').toLowerCase();
  if (lang.startsWith('de')) return 'de';
  if (lang.startsWith('en')) return 'en';
  return 'pl';
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('language');
      if (stored && translations[stored]) return stored;
      return detectBrowserLang();
    }
    return 'pl';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  }, [lang]);

  const t = (key, params = {}) => {
    // Support both flat key (t('key')) and nested path (t('key.en'))
    const dict = translations[lang] || translations.pl;
    let text;

    if (dict[key] !== undefined) {
      // Flat: dict[key] = "translation string"
      text = dict[key];
    } else if (typeof dict[key] === 'object' && dict[key] !== null) {
      // Nested: dict[key] = { en: "...", de: "...", pl: "..." }
      text = dict[key][lang] || dict[key].pl || key;
    } else {
      // Fallback: try en
      text = translations.en[key] || translations.en[key]?.[lang] || key;
    }

    if (typeof text !== 'string') text = key;
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    });
    return text;
  };

  return (
    <I18nContext.Provider value={{ t, lang, setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
