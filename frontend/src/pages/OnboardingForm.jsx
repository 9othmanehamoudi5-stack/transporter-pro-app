import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Building2, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const STRIPE_CHECKOUT_URL = 'https://buy.stripe.com/test_3cIeVebks9bqggLacO7IY07';

const COUNTRIES = [
  { code: 'FR', name: 'France (SIRET)', type: 'SIRET', regex: /^\d{14}$/, placeholder: '123 456 789 00012' },
  { code: 'DE', name: 'Allemagne (USt-IdNr)', type: 'USt-IdNr', regex: /^DE\d{9}$/, placeholder: 'DE123456789' },
  { code: 'ES', name: 'Espagne (NIF/CIF)', type: 'NIF/CIF', regex: /^[A-Z0-9]{9}$/, placeholder: 'B12345678' },
  { code: 'IT', name: 'Italie (Partita IVA)', type: 'Partita IVA', regex: /^IT\d{11}$/, placeholder: 'IT12345678901' },
  { code: 'BE', name: 'Belgique (BCE)', type: 'BCE', regex: /^BE\d{10}$/, placeholder: 'BE0123456789' },
  { code: 'PL', name: 'Pologne (NIP)', type: 'NIP', regex: /^\d{10}$/, placeholder: '1234567890' },
  { code: 'MA', name: 'Maroc (ICE)', type: 'ICE', regex: /^\d{15}$/, placeholder: '123456789012345' },
];

const OnboardingForm = () => {
  const { user } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [countryCode, setCountryCode] = useState('FR');
  const [identifierValue, setIdentifierValue] = useState('');
  
  // Validation states
  const [idLoading, setIdLoading] = useState(false);
  const [idValid, setIdValid] = useState(null);
  const [idError, setIdError] = useState('');

  const currentCountry = COUNTRIES.find(c => c.code === countryCode);

  const handleVerify = async () => {
    const cleaned = identifierValue.replace(/\s/g, '');
    
    if (countryCode === 'FR') {
      if (cleaned.length !== 14) {
        setIdError('Le SIRET doit contenir 14 chiffres');
        setIdValid(false);
        return;
      }
      setIdLoading(true);
      setIdError('');
      try {
        const { data } = await api.get(`/verify-siret/${cleaned}`);
        if (data.valid) {
          setIdValid(true);
          if (data.company_name) setCompanyName(data.company_name);
          if (data.address) setAddress(data.address);
        } else {
          setIdValid(false);
          setIdError(data.error || 'SIRET invalide');
        }
      } catch (err) {
        setIdValid(false);
        setIdError(err.response?.data?.detail || 'Impossible de vérifier le SIRET');
      }
      setIdLoading(false);
    } else {
      // Regex validation for other countries
      if (currentCountry.regex.test(cleaned.toUpperCase())) {
        setIdValid(true);
        setIdError('');
      } else {
        setIdValid(false);
        setIdError(`Format invalide. Attendu : ${currentCountry.placeholder}`);
      }
    }
  };

  const handleIdChange = (e) => {
    setIdentifierValue(e.target.value);
    setIdValid(null);
    setIdError('');
  };

  const handleCountryChange = (e) => {
    setCountryCode(e.target.value);
    setIdentifierValue('');
    setIdValid(null);
    setIdError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (idValid !== true) {
      toast.error(`Veuillez vérifier votre ${currentCountry.type} avant de continuer`);
      return;
    }
    if (!companyName || !address) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        company_name: companyName,
        country_code: countryCode,
        identifier_type: currentCountry.type,
        identifier_value: identifierValue.replace(/\s/g, '').toUpperCase(),
        address,
      };
      
      // Keeping legacy field for backend compatibility if it specifically expects siret
      if (countryCode === 'FR') {
          payload.siret = payload.identifier_value;
      }

      await api.post('/onboarding/complete', payload);
      toast.success('Entreprise enregistrée - redirection vers Stripe.');
      
      const email = user?.email || '';
      const userId = user?.id || '';
      const params = new URLSearchParams();
      if (email) params.set('prefilled_email', email);
      if (userId) params.set('client_reference_id', userId);
      window.location.href = `${STRIPE_CHECKOUT_URL}?${params.toString()}`;
    } catch (error) {
      const msg = error.response?.data?.detail || "Erreur lors de l'enregistrement";
      toast.error(msg);
      setIdValid(false);
      setIdError(msg);
      setLoading(false);
    }
  };

  const canSubmit = idValid === true && companyName.trim() && address.trim() && !loading;

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
            <Label className="text-zinc-300">Pays *</Label>
            <select
              value={countryCode}
              onChange={handleCountryChange}
              className="w-full h-10 px-3 bg-[#121214] border border-[#27272A] rounded-md text-white focus:outline-none focus:border-[#0066FF]"
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">{currentCountry.type} *</Label>
            <div className="flex gap-2">
              <Input
                value={identifierValue}
                onChange={handleIdChange}
                placeholder={currentCountry.placeholder}
                className={`bg-[#121214] text-white flex-1 ${
                  idValid === true
                    ? 'border-green-500'
                    : idValid === false
                    ? 'border-red-500'
                    : 'border-[#27272A]'
                }`}
                data-testid="onboarding-id-value"
                required
              />
              <Button
                type="button"
                onClick={handleVerify}
                disabled={idLoading || identifierValue.trim().length < 5}
                variant="outline"
                className="h-10 px-4 border-[#27272A]"
                data-testid="onboarding-verify-btn"
              >
                {idLoading ? '...' : 'Vérifier'}
              </Button>
            </div>
            {idValid === true && (
              <p className="text-xs text-green-400 flex items-center gap-1" data-testid="id-valid-msg">
                <Check className="w-3 h-3" /> {countryCode === 'FR' ? 'Vérifié via INSEE Sirene' : 'Format valide'}
              </p>
            )}
            {idValid === false && idError && (
              <p className="text-xs text-red-400 flex items-center gap-1" data-testid="id-invalid-msg">
                <AlertCircle className="w-3 h-3" /> {idError}
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
              'Redirection vers Stripe...'
            ) : (
              <>
                Valider et activer l'essai
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          <p className="text-[10px] text-zinc-600 text-center">
            Redirection Stripe - carte bancaire requise, débit 0€ pendant 30 jours.
            Données protégées RGPD.
          </p>
        </form>
      </div>
    </div>
  );
};

export default OnboardingForm;
