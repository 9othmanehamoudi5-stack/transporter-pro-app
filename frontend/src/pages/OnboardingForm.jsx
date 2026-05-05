import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Building2, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const STRIPE_CHECKOUT_URL = 'https://buy.stripe.com/test_3cIeVebks9bqggLacO7IY07';

const OnboardingForm = () => {
  const { user } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [siret, setSiret] = useState('');
  const [tvaIntra, setTvaIntra] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [siretLoading, setSiretLoading] = useState(false);
  const [siretValid, setSiretValid] = useState(null);
  const [siretError, setSiretError] = useState('');

  const handleVerifySiret = async () => {
    const cleaned = siret.replace(/\s/g, '');
    if (cleaned.length !== 14) {
      setSiretError('Le SIRET doit contenir 14 chiffres');
      setSiretValid(false);
      return;
    }
    setSiretLoading(true);
    setSiretError('');
    try {
      const { data } = await api.get(`/verify-siret/${cleaned}`);
      if (data.valid) {
        setSiretValid(true);
        if (data.company_name) setCompanyName(data.company_name);
        if (data.address) setAddress(data.address);
      } else {
        setSiretValid(false);
        setSiretError(data.error || 'SIRET invalide');
      }
    } catch (err) {
      setSiretValid(false);
      setSiretError(err.response?.data?.detail || 'Impossible de vérifier le SIRET');
    }
    setSiretLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Hard gate: no submission unless SIRET is positively verified by backend
    if (siretValid !== true) {
      toast.error('Veuillez vérifier votre SIRET avant de continuer');
      return;
    }
    if (!companyName || !address) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setLoading(true);
    try {
      await api.post('/onboarding/complete', {
        company_name: companyName,
        siret: siret.replace(/\s/g, ''),
        tva_intra: tvaIntra,
        address,
      });
      toast.success('Entreprise enregistrée — redirection vers Stripe…');
      // Redirect EXCLUSIVELY to Stripe — user never sees dashboard before payment
      const email = user?.email || '';
      window.location.href = `${STRIPE_CHECKOUT_URL}?prefilled_email=${encodeURIComponent(email)}`;
    } catch (error) {
      const msg = error.response?.data?.detail || "Erreur lors de l'enregistrement";
      toast.error(msg);
      // If backend rejects SIRET (e.g. spoofed from devtools), reset the gate
      if (msg.toLowerCase().includes('siret')) {
        setSiretValid(false);
        setSiretError(msg);
      }
      setLoading(false);
    }
  };

  const canSubmit = siretValid === true && companyName.trim() && address.trim() && !loading;

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center px-6 py-10" data-testid="onboarding-form">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#0066FF]/10 rounded-2xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-[#0066FF]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Configurez votre entreprise
          </h1>
          <p className="text-sm text-zinc-400">
            Vérification KYB obligatoire avant activation Stripe (essai 30 jours, débit 0€).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-zinc-300">Numéro de SIRET *</Label>
            <div className="flex gap-2">
              <Input
                value={siret}
                onChange={(e) => {
                  setSiret(e.target.value);
                  setSiretValid(null);
                  setSiretError('');
                }}
                placeholder="123 456 789 00012"
                className={`bg-[#121214] text-white flex-1 ${
                  siretValid === true
                    ? 'border-green-500'
                    : siretValid === false
                    ? 'border-red-500'
                    : 'border-[#27272A]'
                }`}
                data-testid="onboarding-siret"
                required
              />
              <Button
                type="button"
                onClick={handleVerifySiret}
                disabled={siretLoading || siret.replace(/\s/g, '').length < 14}
                variant="outline"
                className="h-10 px-4 border-[#27272A]"
                data-testid="onboarding-verify-siret-btn"
              >
                {siretLoading ? '...' : 'Vérifier'}
              </Button>
            </div>
            {siretValid === true && (
              <p className="text-xs text-green-400 flex items-center gap-1" data-testid="siret-valid-msg">
                <Check className="w-3 h-3" /> SIRET vérifié via INSEE Sirene
              </p>
            )}
            {siretValid === false && siretError && (
              <p className="text-xs text-red-400 flex items-center gap-1" data-testid="siret-invalid-msg">
                <AlertCircle className="w-3 h-3" /> {siretError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Nom de l'entreprise *</Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Transport Express SARL"
              className="bg-[#121214] border-[#27272A] text-white"
              data-testid="onboarding-company-name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">TVA Intracommunautaire</Label>
            <Input
              value={tvaIntra}
              onChange={(e) => setTvaIntra(e.target.value)}
              placeholder="FR12345678901"
              className="bg-[#121214] border-[#27272A] text-white"
              data-testid="onboarding-tva"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Adresse du siège *</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="12 Rue de la Logistique, 75008 Paris"
              className="bg-[#121214] border-[#27272A] text-white"
              data-testid="onboarding-address"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={!canSubmit}
            className={`w-full h-12 rounded-xl font-semibold transition-colors ${
              canSubmit
                ? 'bg-[#0066FF] hover:bg-[#0052CC] text-white'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
            data-testid="onboarding-submit"
          >
            {loading ? (
              'Redirection vers Stripe…'
            ) : (
              <>
                Valider et activer l'essai
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          <p className="text-[10px] text-zinc-600 text-center">
            Redirection Stripe — carte bancaire requise, débit 0€ pendant 30 jours.
            Données protégées RGPD.
          </p>
        </form>
      </div>
    </div>
  );
};

export default OnboardingForm;
