import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';

const LegalLayout = ({ title, children }) => (
  <div className="min-h-screen bg-black text-white flex flex-col">
    <div className="flex-1 max-w-3xl mx-auto px-6 py-16">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-10">
        <ArrowLeft className="w-4 h-4" />
        Retour à l'accueil
      </Link>
      <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>{title}</h1>
      <div className="prose prose-invert prose-zinc max-w-none text-zinc-400 space-y-6 text-sm leading-relaxed">
        {children}
      </div>
    </div>
    <Footer />
  </div>
);

export const CGUPage = () => (
  <LegalLayout title="Conditions Générales d'Utilisation">
    <p><strong>Dernière mise à jour :</strong> Avril 2026</p>

    <h2 className="text-lg font-semibold text-white mt-8">1. Objet</h2>
    <p>Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme Transporter-Pro, éditée par Transporter-Pro SAS, destinée aux professionnels du transport et de la logistique.</p>

    <h2 className="text-lg font-semibold text-white mt-8">2. Acceptation des CGU</h2>
    <p>L'inscription sur la plateforme implique l'acceptation pleine et entière des présentes CGU. L'utilisateur s'engage à les respecter dans le cadre de toute utilisation du service.</p>

    <h2 className="text-lg font-semibold text-white mt-8">3. Description du service</h2>
    <p>Transporter-Pro fournit une suite d'outils SaaS comprenant : la gestion de livraisons, l'analyse IA des dommages de colis, le suivi GPS en temps réel, la génération de documents e-CMR, et le calcul de scores d'éco-conduite.</p>

    <h2 className="text-lg font-semibold text-white mt-8">4. Comptes utilisateurs</h2>
    <p>L'accès à la plateforme nécessite la création d'un compte. L'utilisateur est responsable de la confidentialité de ses identifiants. Les comptes chauffeurs sont créés exclusivement par l'administrateur de l'entreprise.</p>

    <h2 className="text-lg font-semibold text-white mt-8">5. Abonnements et facturation</h2>
    <p>L'utilisation de la plateforme est soumise à un abonnement mensuel ou annuel selon le plan choisi (Solo, Croissance, Flotte Pro). Les tarifs sont affichés en euros HT sur la page d'abonnement.</p>

    <h2 className="text-lg font-semibold text-white mt-8">6. Responsabilité</h2>
    <p>Transporter-Pro s'engage à fournir un service disponible et fiable. Toutefois, la plateforme ne saurait être tenue responsable des interruptions temporaires liées à la maintenance ou à des circonstances indépendantes de sa volonté.</p>

    <h2 className="text-lg font-semibold text-white mt-8">7. Propriété intellectuelle</h2>
    <p>L'ensemble des éléments constituant la plateforme (logiciels, interfaces, textes, images, algorithmes) est la propriété exclusive de Transporter-Pro SAS et est protégé par le droit de la propriété intellectuelle.</p>

    <h2 className="text-lg font-semibold text-white mt-8">8. Résiliation</h2>
    <p>L'utilisateur peut résilier son abonnement à tout moment depuis son espace personnel. La résiliation prend effet à la fin de la période de facturation en cours.</p>
  </LegalLayout>
);

export const ConfidentialitePage = () => (
  <LegalLayout title="Politique de Confidentialité (RGPD)">
    <p><strong>Dernière mise à jour :</strong> Avril 2026</p>

    <h2 className="text-lg font-semibold text-white mt-8">1. Responsable du traitement</h2>
    <p>Le responsable du traitement des données est Transporter-Pro SAS, dont le siège social est situé en France. Pour toute question relative à la protection de vos données, contactez notre DPO à l'adresse : dpo@transporter-pro.com.</p>

    <h2 className="text-lg font-semibold text-white mt-8">2. Données collectées</h2>
    <p>Nous collectons les données suivantes : nom, prénom, adresse email, numéro de téléphone professionnel, données de géolocalisation (pour le suivi GPS), photographies de colis (pour l'analyse IA), et données de conduite (pour le score éco-conduite).</p>

    <h2 className="text-lg font-semibold text-white mt-8">3. Finalités du traitement</h2>
    <p>Vos données sont traitées pour : la gestion de votre compte, le suivi des livraisons en temps réel, l'analyse automatisée des dommages de colis, le calcul des scores d'éco-conduite, et l'amélioration continue de nos services.</p>

    <h2 className="text-lg font-semibold text-white mt-8">4. Base légale</h2>
    <p>Le traitement repose sur l'exécution du contrat (abonnement), l'intérêt légitime (amélioration du service), et le consentement (géolocalisation, cookies non essentiels).</p>

    <h2 className="text-lg font-semibold text-white mt-8">5. Durée de conservation</h2>
    <p>Les données de compte sont conservées pendant la durée de l'abonnement et 3 ans après résiliation. Les données de géolocalisation sont conservées 90 jours. Les photographies de colis sont conservées 1 an.</p>

    <h2 className="text-lg font-semibold text-white mt-8">6. Vos droits</h2>
    <p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de portabilité, de limitation et d'opposition au traitement de vos données. Exercez vos droits en écrivant à : dpo@transporter-pro.com.</p>

    <h2 className="text-lg font-semibold text-white mt-8">7. Sécurité</h2>
    <p>Nous mettons en oeuvre des mesures techniques et organisationnelles appropriées (chiffrement TLS, hachage des mots de passe, contrôle d'accès strict) pour garantir la sécurité de vos données.</p>

    <h2 className="text-lg font-semibold text-white mt-8">8. Transferts hors UE</h2>
    <p>Certaines données peuvent être traitées par des sous-traitants situés hors de l'Union Européenne (hébergement cloud). Ces transferts sont encadrés par des clauses contractuelles types approuvées par la Commission européenne.</p>
  </LegalLayout>
);

export const ContactPage = () => (
  <LegalLayout title="Contact">
    <p>Pour toute question, demande commerciale ou demande de support technique, vous pouvez nous joindre par les moyens suivants :</p>

    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 mt-4 space-y-3 not-prose">
      <div>
        <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Email</p>
        <p className="text-white">contact@transporter-pro.com</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Support technique</p>
        <p className="text-white">support@transporter-pro.com</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Téléphone</p>
        <p className="text-white">+33 1 23 45 67 89</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Adresse</p>
        <p className="text-white">Transporter-Pro SAS<br />12 Rue de la Logistique<br />75008 Paris, France</p>
      </div>
    </div>

    <p className="mt-6">Notre équipe s'engage à répondre à toute demande dans un délai de 48 heures ouvrées.</p>
  </LegalLayout>
);
