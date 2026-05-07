import React, { createContext, useContext, useEffect, useState } from 'react';
import fr from './fr.json';
import en from './en.json';
import es from './es.json';

const translations = { fr, en, es };

const I18nContext = createContext();

export const useI18n = () => useContext(I18nContext);

export const I18nProvider = ({ children }) => {
  const [locale, setLocale] = useState(() => {
    // 1) Explicit choice (last selected by user) wins
    const stored = localStorage.getItem('tp-locale');
    if (stored && ['fr', 'en', 'es'].includes(stored)) return stored;
    // 2) Auto-detect from browser navigator language (e.g., "es-ES" → "es")
    if (typeof navigator !== 'undefined' && navigator.language) {
      const detected = navigator.language.slice(0, 2).toLowerCase();
      if (['fr', 'en', 'es'].includes(detected)) {
        // Persist so subsequent visits don't re-detect (avoids surprise if user's nav lang changes)
        localStorage.setItem('tp-locale', detected);
        return detected;
      }
    }
    // 3) Sensible default: English (international SaaS audience)
    return 'en';
  });

  // Sync from user preference once it's loaded (auth-aware)
  useEffect(() => {
    const handler = (e) => {
      const newLoc = e.detail?.locale;
      if (newLoc && ['fr', 'en', 'es'].includes(newLoc) && newLoc !== locale) {
        setLocale(newLoc);
        localStorage.setItem('tp-locale', newLoc);
        document.documentElement.setAttribute('lang', newLoc);
      }
    };
    window.addEventListener('tp-locale-change', handler);
    return () => window.removeEventListener('tp-locale-change', handler);
  }, [locale]);

  const t = (key, fallback) => {
    const keys = key.split('.');
    let value = translations[locale] || translations.fr;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || fallback || key;
  };

  const changeLocale = (newLocale) => {
    if (!['fr', 'en', 'es'].includes(newLocale)) return;
    setLocale(newLocale);
    localStorage.setItem('tp-locale', newLocale);
    document.documentElement.setAttribute('lang', newLocale);
  };

  return (
    <I18nContext.Provider
      value={{
        locale,
        lang: locale,
        t,
        changeLocale,
        setLang: changeLocale,
        locales: ['fr', 'en', 'es'],
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};
