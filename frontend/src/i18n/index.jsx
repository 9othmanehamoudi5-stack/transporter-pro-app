import React, { createContext, useContext, useState } from 'react';
import fr from './fr.json';
import en from './en.json';
import es from './es.json';

const translations = { fr, en, es };

const I18nContext = createContext();

export const useI18n = () => useContext(I18nContext);

export const I18nProvider = ({ children }) => {
  const [locale, setLocale] = useState(() => localStorage.getItem('tp-locale') || 'fr');

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[locale] || translations.fr;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
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
        // alias for ergonomics
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
