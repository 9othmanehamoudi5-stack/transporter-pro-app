import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, X } from 'lucide-react';
import { Button } from './ui/button';

export const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('tp_cookie_consent');
    if (!consent) {
      // Small delay for clean entrance
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('tp_cookie_consent', 'accepted_' + new Date().toISOString());
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
      data-testid="cookie-banner"
    >
      <div className="bg-[#121216]/95 border border-[#27272A] rounded-2xl p-5 shadow-2xl backdrop-blur-xl text-xs text-zinc-300">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex-shrink-0 flex items-center justify-center text-blue-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm">Confidentialité & Données (RGPD)</span>
              <button
                onClick={handleAccept}
                className="text-zinc-500 hover:text-white transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="leading-relaxed text-zinc-400">
              Transporter-Pro utilise des cookies techniques et des traceurs de session chiffrés strictement nécessaires au fonctionnement de l'application et à la sécurité de vos données. Aucun cookie publicitaire n'est collecté.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Button
                size="sm"
                onClick={handleAccept}
                className="bg-[#0066FF] hover:bg-[#0052cc] text-white font-medium text-xs h-8 px-4"
                data-testid="cookie-accept-btn"
              >
                Accepter & Continuer
              </Button>
              <Link
                to="/confidentialite"
                className="text-zinc-400 hover:text-white underline text-[11px] transition-colors"
              >
                En savoir plus
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
