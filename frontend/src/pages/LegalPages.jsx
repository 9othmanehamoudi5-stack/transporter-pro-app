import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Scale, FileText, Lock } from 'lucide-react';
import Footer from '../components/Footer';

const LegalLayout = ({ title, icon: Icon, children }) => (
  <div className="min-h-screen bg-black text-white flex flex-col">
    <div className="flex-1 max-w-4xl mx-auto px-6 py-16 w-full">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" />
        Retour à l'accueil
      </Link>
      
      <div className="flex items-center gap-3 mb-6">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
          {title}
        </h1>
      </div>

      <div className="prose prose-invert prose-zinc max-w-none text-zinc-300 space-y-6 text-sm leading-relaxed border-t border-zinc-800 pt-8">
        {children}
      </div>
    </div>
    <Footer />
  </div>
);

// ==================== MENTIONS LÉGALES (LOI LCEN 2004) ====================
export const MentionsLegalesPage = () => (
  <LegalLayout title="Mentions Légales" icon={Scale}>
    <p className="text-zinc-400 text-xs">Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN).</p>

    <h2 className="text-lg font-bold text-white mt-8">1. Éditeur du site et de la plateforme</h2>
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-2 text-zinc-300 not-prose">
      <p><strong>Dénomination sociale :</strong> Transporter-Pro SAS</p>
      <p><strong>Forme juridique :</strong> Société par Actions Simplifiée (SAS)</p>
      <p><strong>Capital social :</strong> 10 000,00 €</p>
      <p><strong>Siège social :</strong> 12 Rue de la Logistique, 75008 Paris, France</p>
      <p><strong>Numéro SIREN :</strong> 849 321 094 (RCS Paris)</p>
      <p><strong>Numéro de TVA intracommunautaire :</strong> FR 82 849321094</p>
      <p><strong>Courriel de contact :</strong> contact@transporter-pro.com</p>
      <p><strong>Téléphone :</strong> +33 1 23 45 67 89</p>
    </div>

    <h2 className="text-lg font-bold text-white mt-8">2. Directeur de la publication</h2>
    <p>Le directeur de la publication du site et de l'application est la Direction Générale de Transporter-Pro SAS (contact@transporter-pro.com).</p>

    <h2 className="text-lg font-bold text-white mt-8">3. Hébergement du service</h2>
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-2 text-zinc-300 not-prose">
      <p><strong>Hébergeur d'infrastructure Cloud :</strong> Emergent & Amazon Web Services (AWS EMEA SARL)</p>
      <p><strong>Localisation des serveurs de production :</strong> Région Paris (Europe West / France), assurant la souveraineté et le respect intégral du RGPD.</p>
      <p><strong>Adresse de l'hébergeur :</strong> 38 Avenue John F. Kennedy, L-1855 Luxembourg</p>
    </div>

    <h2 className="text-lg font-bold text-white mt-8">4. Propriété intellectuelle</h2>
    <p>L'ensemble des marques, logos, visuels, algorithmes de routage, interfaces logicielles, codes sources et bases de données composant la plateforme Transporter-Pro sont protégés par le Code de la propriété intellectuelle. Toute reproduction totale ou partielle sans accord écrit préalable est strictement interdite.</p>
  </LegalLayout>
);

// ==================== CONDITIONS GÉNÉRALES D'UTILISATION (CGU) ====================
export const CGUPage = () => (
  <LegalLayout title="Conditions Générales d'Utilisation (CGU)" icon={FileText}>
    <p><strong>Dernière mise à jour :</strong> Octobre 2026</p>

    <h2 className="text-lg font-bold text-white mt-8">1. Objet</h2>
    <p>Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme Transporter-Pro, éditée par Transporter-Pro SAS, destinée aux professionnels du transport routier de marchandises (TRM) et de la logistique.</p>

    <h2 className="text-lg font-bold text-white mt-8">2. Acceptation des CGU</h2>
    <p>L'inscription sur la plateforme implique l'acceptation pleine et entière des présentes CGU. L'utilisateur professionnel s'engage à les respecter dans le cadre de toute utilisation du service.</p>

    <h2 className="text-lg font-bold text-white mt-8">3. Description des services SaaS</h2>
    <p>Transporter-Pro fournit une suite d'outils comprenant :</p>
    <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
      <li>Gestion et assignation des tournées de livraison ;</li>
      <li>Édition de lettres de voiture électroniques (e-CMR) avec signature numérique du destinataire ;</li>
      <li>Analyse assistée par IA des photos de dommages et génération de réserves de livraison ;</li>
      <li>Suivi de flotte par géolocalisation en temps réel (uniquement pendant l'exécution des missions) ;</li>
      <li>Calcul télématique d'éco-conduite et d'impact carbone (Scope 3 RSE) ;</li>
      <li>Tableaux de bord de cash-flow et émission de factures au format Factur-X.</li>
    </ul>

    <h2 className="text-lg font-bold text-white mt-8">4. Comptes et sécurité des accès</h2>
    <p>L'accès à la plateforme nécessite la création d'un compte administrateur. Le client est seul responsable de la confidentialité de ses identifiants. Les comptes chauffeurs sont créés sous l'entière autorité et responsabilité de l'entreprise cliente employeur.</p>

    <h2 className="text-lg font-bold text-white mt-8">5. Conformité e-CMR & Réglementation Transport</h2>
    <div className="bg-blue-500/10 border border-blue-500/25 rounded-xl p-4 mt-2">
      <p className="text-blue-200">
        <strong>Cadre réglementaire de l'e-CMR :</strong> La lettre de voiture électronique générée par Transporter-Pro intègre les mentions obligatoires requises par l'Article 6 de la Convention de Genève du 19 mai 1956 (CMR), le Protocole additionnel e-CMR de 2008 (Décret français n° 2016-1365) et le Règlement européen eFTI (UE 2020/1056). Chaque document comporte une signature tactile horodatée et une empreinte cryptographique d'intégrité SHA-256 (valeur probante conformément aux articles 1366 et 1367 du Code civil).
      </p>
    </div>

    <h2 className="text-lg font-bold text-white mt-8">6. Traçabilité et Audit Log (Conservation 5 ans)</h2>
    <p>Conformément aux obligations de traçabilité légale dans le transport routier, toutes les transactions, signatures, créations de factures et modifications de tournées font l'objet d'un journal d'audit infalsifiable conservé pendant une durée minimale de 5 ans.</p>
  </LegalLayout>
);

// ==================== CONDITIONS GÉNÉRALES DE VENTE (CGV B2B) ====================
export const CGVPage = () => (
  <LegalLayout title="Conditions Générales de Vente (CGV B2B)" icon={Scale}>
    <p><strong>Applicables aux abonnements professionnels Transporter-Pro SaaS — Octobre 2026</strong></p>

    <h2 className="text-lg font-bold text-white mt-8">1. Champ d'application</h2>
    <p>Les présentes CGV s'appliquent de plein droit à toute souscription d'abonnement au service Transporter-Pro par un professionnel (personne physique ou morale immatriculée au RCS ou détenant un numéro de SIRET valide).</p>

    <h2 className="text-lg font-bold text-white mt-8">2. Formules d'abonnement et Tarifs</h2>
    <p>Les tarifs sont indiqués en Euros Hors Taxes (€ HT). La TVA au taux légal en vigueur (20% en France métropolitaine) est ajoutée lors de la facturation. Trois formules sont proposées :</p>
    <ul className="list-disc pl-5 space-y-1 text-zinc-300">
      <li><strong>Plan Solo :</strong> 29 € HT / mois (jusqu'à 3 chauffeurs)</li>
      <li><strong>Plan Croissance :</strong> 189 € HT / mois (jusqu'à 15 chauffeurs)</li>
      <li><strong>Plan Flotte Pro :</strong> 489 € HT / mois (chauffeurs illimités)</li>
    </ul>

    <h2 className="text-lg font-bold text-white mt-8">3. Modalités de paiement & Sécurité</h2>
    <p>Le règlement s'effectue par carte bancaire ou prélèvement SEPA via notre prestataire de paiement sécurisé certifié PCI-DSS <strong>Stripe Inc.</strong>. La facturation a lieu au début de chaque cycle (mensuel ou annuel).</p>

    <h2 className="text-lg font-bold text-white mt-8">4. Absence de droit de rétractation entre professionnels</h2>
    <p>Conformément aux dispositions de l'article L. 221-28 13° du Code de la consommation, le droit de rétractation ne s'applique pas aux contrats de fourniture de contenu numérique et de services logiciels exécutés immédiatement après la souscription entre professionnels.</p>

    <h2 className="text-lg font-bold text-white mt-8">5. Retards de paiement et Frais de recouvrement</h2>
    <p>Conformément aux articles L. 441-10 et D. 441-5 du Code de commerce, tout retard de paiement donne lieu de plein droit et sans mise en demeure préalable à :</p>
    <ul className="list-disc pl-5 space-y-1 text-zinc-300">
      <li>L'application de pénalités de retard égales au taux directeur semestriel de la Banque Centrale Européenne (BCE) majoré de 10 points de pourcentage ;</li>
      <li>Une indemnité forfaitaire légale pour frais de recouvrement de <strong>40 €</strong>.</li>
    </ul>

    <h2 className="text-lg font-bold text-white mt-8">6. Durée et Résiliation</h2>
    <p>Les abonnements mensuels sont souscrits sans engagement de durée et sont résiliables à tout moment en un clic depuis l'espace client. La résiliation prend effet au dernier jour de la période mensuelle déjà réglée.</p>

    <h2 className="text-lg font-bold text-white mt-8">7. Limitation de responsabilité & SLA</h2>
    <p>Transporter-Pro s'engage à une disponibilité du service de 99,5% hors périodes de maintenance programmée. En tout état de cause, la responsabilité pécuniaire totale de Transporter-Pro SAS est expressément plafonnée au montant total effectivement versé par le client au cours des douze (12) derniers mois.</p>

    <h2 className="text-lg font-bold text-white mt-8">8. Droit applicable et Tribunal compétent</h2>
    <p>Les présentes CGV sont soumises au droit français. En cas de litige relatif à leur validité, interprétation ou exécution, compétence expresse est attribuée au <strong>Tribunal de Commerce de Paris</strong>, nonobstant pluralité de défendeurs ou appel en garantie.</p>
  </LegalLayout>
);

// ==================== POLITIQUE DE CONFIDENTIALITÉ (RGPD) ====================
export const ConfidentialitePage = () => (
  <LegalLayout title="Politique de Confidentialité & RGPD" icon={Shield}>
    <p><strong>Conformité au Règlement Général sur la Protection des Données (Règlement UE 2016/679)</strong></p>

    <h2 className="text-lg font-bold text-white mt-8">1. Responsable de traitement & DPO</h2>
    <p>Le responsable de traitement est Transporter-Pro SAS (12 Rue de la Logistique, 75008 Paris). Pour toute demande relative à vos données personnelles, vous pouvez contacter notre Délégué à la Protection des Données (DPO) à l'adresse : <strong>dpo@transporter-pro.com</strong>.</p>

    <h2 className="text-lg font-bold text-white mt-8">2. Rôles respectifs : Responsable vs Sous-traitant (Art. 28 RGPD)</h2>
    <p>Dans le cadre de l'utilisation de Transporter-Pro :</p>
    <ul className="list-disc pl-5 space-y-1.5 text-zinc-300">
      <li><strong>Transporter-Pro agit en tant que Responsable de Traitement</strong> pour la gestion des comptes clients, la facturation et le support.</li>
      <li><strong>Transporter-Pro agit en tant que Sous-traitant (au sens de l'Art. 28 RGPD)</strong> pour le compte du transporteur client qui reste le Responsable des données de ses propres chauffeurs, sous-traitants et destinataires de livraisons. Transporter-Pro s'engage à ne jamais céder, louer ou commercialiser ces données métier.</li>
    </ul>

    <h2 className="text-lg font-bold text-white mt-8">3. Géolocalisation des Chauffeurs (Conformité stricte CNIL)</h2>
    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mt-2">
      <p className="text-emerald-200">
        <strong>Engagement CNIL :</strong> Conformément aux recommandations de la CNIL et à l'article L. 1121-1 du Code du travail, la géolocalisation des chauffeurs n'est activée que pendant l'exécution effective d'une mission de livraison active. Dès qu'une livraison est clôturée ou que le chauffeur met fin à sa tournée, tout traçage GPS est immédiatement et automatiquement interrompu. Aucune géolocalisation n'est opérée en dehors des heures de service ou lors des temps de pause.
      </p>
    </div>

    <h2 className="text-lg font-bold text-white mt-8">4. Durées de conservation des données</h2>
    <ul className="list-disc pl-5 space-y-1 text-zinc-300">
      <li><strong>Données de facturation et e-CMR :</strong> 5 ans (obligations légales comptables et transport).</li>
      <li><strong>Traces GPS télématiques :</strong> 90 jours maximum (durée légale recommandée par la CNIL pour l'optimisation des tournées).</li>
      <li><strong>Photos de litiges et réserves :</strong> 1 an après résolution du litige.</li>
    </ul>

    <h2 className="text-lg font-bold text-white mt-8">5. Vos droits (Accès, Rectification, Effacement, Portabilité)</h2>
    <p>Conformément aux articles 15 à 21 du RGPD, vous disposez d'un droit d'accès, de rectification, de portabilité et d'effacement de vos données personnelles. Vous pouvez exporter vos données directement depuis les Paramètres de votre compte ou adresser une demande à <strong>dpo@transporter-pro.com</strong>.</p>
  </LegalLayout>
);

// ==================== CONTACT ====================
export const ContactPage = () => (
  <LegalLayout title="Contact & Support" icon={Lock}>
    <p>Pour toute question commerciale, partenariat ou assistance technique :</p>

    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 mt-4 space-y-4 not-prose">
      <div>
        <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Support Client & Technique</p>
        <p className="text-white font-medium">support@transporter-pro.com</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Délégué à la Protection des Données (DPO / RGPD)</p>
        <p className="text-white font-medium">dpo@transporter-pro.com</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Siège Administratif</p>
        <p className="text-white">Transporter-Pro SAS<br />12 Rue de la Logistique, 75008 Paris, France</p>
      </div>
    </div>
  </LegalLayout>
);
