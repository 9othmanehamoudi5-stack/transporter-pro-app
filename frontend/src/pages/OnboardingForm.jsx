import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Building2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

const OnboardingForm = ({ onComplete }) => {
  const [companyName, setCompanyName] = useState('');
  const [siret, setSiret] = useState('');
  const [tvaIntra, setTvaIntra] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyName || !siret || !address) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setLoading(true);
    try {
      await api.post('/onboarding/complete', {
        company_name: companyName,
        siret,
        tva_intra: tvaIntra,
        address
      });
      toast.success('Entreprise enregistrée avec succès !');
      onComplete();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'enregistrement');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center px-6" data-testid="onboarding-form">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#0066FF]/10 rounded-2xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-[#0066FF]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
            Configurez votre entreprise
          </h1>
          <p className="text-sm text-zinc-400">
            Ces informations sont requises pour la facturation et la conformité légale.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-zinc-300">Nom de l'entreprise *</Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Transport Express SARL"
              className="bg-[#121214] border-[#27272A] text-white"
              data-testid="onboarding-company-name"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Numéro de SIRET *</Label>
            <Input
              value={siret}
              onChange={(e) => setSiret(e.target.value)}
              placeholder="123 456 789 00012"
              className="bg-[#121214] border-[#27272A] text-white"
              data-testid="onboarding-siret"
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
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold rounded-xl"
            data-testid="onboarding-submit"
          >
            {loading ? 'Enregistrement...' : (
              <>
                Valider et accéder au Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          <p className="text-[10px] text-zinc-600 text-center">
            Ces données sont protégées conformément au RGPD et ne seront jamais partagées.
          </p>
        </form>
      </div>
    </div>
  );
};

export default OnboardingForm;
