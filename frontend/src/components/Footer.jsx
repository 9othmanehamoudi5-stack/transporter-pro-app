import React from 'react';
import { Link } from 'react-router-dom';
import { Truck } from 'lucide-react';

const Footer = () => (
  <footer className="border-t border-white/[0.06] bg-black py-10 px-6" data-testid="footer">
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-2 text-zinc-500 text-sm">
        <Truck className="w-4 h-4" />
        <span>&copy; {new Date().getFullYear()} Transporter-Pro. Tous droits réservés.</span>
      </div>
      <div className="flex items-center gap-6 text-sm text-zinc-500">
        <Link to="/cgu" className="hover:text-white transition-colors" data-testid="footer-cgu">CGU</Link>
        <Link to="/confidentialite" className="hover:text-white transition-colors" data-testid="footer-rgpd">Confidentialité (RGPD)</Link>
        <Link to="/contact" className="hover:text-white transition-colors" data-testid="footer-contact">Contact</Link>
      </div>
    </div>
  </footer>
);

export default Footer;
