import React from 'react';
import { Link } from 'react-router-dom';
import { Truck } from 'lucide-react';

const Footer = () => (
  <footer className="border-t border-white/[0.06] bg-[#0f172a] py-12 px-6" data-testid="footer">
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-[#0066FF] rounded-lg flex items-center justify-center">
              <Truck className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white">Transporter-Pro</span>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed max-w-xs">
            La plateforme de gestion de flotte qui protège vos marges grâce à l'IA.
          </p>
        </div>

        {/* Links */}
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-3">Légal</p>
          <div className="flex flex-col gap-2 text-sm text-zinc-500">
            <Link to="/cgu" className="hover:text-white transition-colors" data-testid="footer-cgu">Mentions Légales / CGU</Link>
            <Link to="/confidentialite" className="hover:text-white transition-colors" data-testid="footer-rgpd">Confidentialité (RGPD)</Link>
            <Link to="/contact" className="hover:text-white transition-colors" data-testid="footer-contact">Contact</Link>
          </div>
        </div>

        {/* Tarifs */}
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-3">Offres</p>
          <div className="flex flex-col gap-2 text-sm text-zinc-500">
            <a href="#pricing" className="hover:text-white transition-colors" data-testid="footer-tarifs">Tarifs</a>
            <span className="text-zinc-600">Solo : 19€/mois</span>
            <span className="text-zinc-600">Croissance : 189€/mois</span>
            <span className="text-zinc-600">Flotte Pro : 489€/mois</span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.04] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-zinc-600">&copy; {new Date().getFullYear()} Transporter-Pro SAS. Tous droits réservés.</p>
        <p className="text-[10px] text-zinc-700">Outil d'aide à la gestion interne — En attente d'homologation e-CMR</p>
      </div>
    </div>
  </footer>
);

export default Footer;
