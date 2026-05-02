import React, { createContext, useContext, useState } from 'react';
import fr from './fr.json';
import pl from './pl.json';
import es from './es.json';

const translations = { fr, pl, es };

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
    setLocale(newLocale);
    localStorage.setItem('tp-locale', newLocale);
  };

  return (
    <I18nContext.Provider value={{ locale, t, changeLocale, locales: ['fr', 'pl', 'es'] }}>
      {children}
    </I18nContext.Provider>
  );
};
