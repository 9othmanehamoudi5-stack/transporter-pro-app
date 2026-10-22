import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, ShieldCheck } from 'lucide-react';

const Footer = () => (
  <footer className="border-t border-white/[0.06] bg-[#0A0A0E] py-12 px-6" data-testid="footer">
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-[#0066FF] rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Truck className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-base tracking-tight">Transporter-Pro</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
            Plateforme SaaS de gestion de flotte, e-CMR électronique, facturation Factur-X et audit RSE pour le transport routier français.
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Données souveraines hébergées en France · Conforme RGPD</span>
          </div>
        </div>

        {/* Legal & Navigation Links */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-zinc-400">
          <Link to="/mentions-legales" className="hover:text-white transition-colors" data-testid="footer-mentions">
            Mentions Légales
          </Link>
          <Link to="/cgu" className="hover:text-white transition-colors" data-testid="footer-cgu">
            CGU
          </Link>
          <Link to="/cgv" className="hover:text-white transition-colors" data-testid="footer-cgv">
            CGV B2B
          </Link>
          <Link to="/confidentialite" className="hover:text-white transition-colors" data-testid="footer-privacy">
            Confidentialité (RGPD)
          </Link>
          <Link to="/contact" className="hover:text-white transition-colors" data-testid="footer-contact">
            Contact
          </Link>
        </div>
      </div>

      <div className="border-t border-white/[0.06] pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
        <p>&copy; {new Date().getFullYear()} Transporter-Pro SAS. Tous droits réservés.</p>
        <p className="text-zinc-500 text-center md:text-right">
          Conforme Convention CMR (1956), Protocole e-CMR (2008 / Décret n° 2016-1365) & Règlement européen eFTI (UE 2020/1056).
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
