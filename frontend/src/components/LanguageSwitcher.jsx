import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useI18n } from '../i18n/index';

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: 'FR' },
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'es', label: 'Español', flag: 'ES' },
];

export const LanguageSwitcher = () => {
  const { locale, changeLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const current = LANGUAGES.find(l => l.code === locale) || LANGUAGES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="h-9 px-3 flex items-center gap-2 rounded-md border border-[#27272A] bg-transparent text-zinc-300 hover:text-white hover:bg-[#1A1A1E] transition-colors"
        data-testid="lang-switcher-btn"
        aria-label="Change language"
      >
        <Globe className="w-4 h-4" />
        <span className="text-xs font-semibold tracking-wider">{current.flag}</span>
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 w-44 rounded-lg border border-[#27272A] bg-[#121214] shadow-2xl z-[100] overflow-hidden"
          data-testid="lang-switcher-menu"
        >
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => {
                changeLocale(l.code);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-sm transition-colors ${
                l.code === locale ? 'bg-[#0066FF]/10 text-[#0066FF]' : 'text-zinc-300 hover:bg-[#1A1A1E] hover:text-white'
              }`}
              data-testid={`lang-option-${l.code}`}
            >
              <span className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#1A1A1E] border border-[#27272A]">
                  {l.flag}
                </span>
                <span>{l.label}</span>
              </span>
              {l.code === locale && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
