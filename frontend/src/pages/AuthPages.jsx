import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Truck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Footer from '../components/Footer';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col px-4 relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1730033135158-c87def1b7af0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwyfHxsb2dpc3RpY3MlMjBkZWxpdmVyeSUyMHRydWNrJTIwbW9kZXJuJTIwbmlnaHR8ZW58MHx8fHwxNzc1MDY2MDc1fDA&ixlib=rb-4.1.0&q=85')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/90 to-[#0A0A0B]/70" />

      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-[#0066FF] rounded-xl flex items-center justify-center">
            <Truck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Transporter-Pro</h1>
        </div>

        {/* Login Card */}
        <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-2">Connexion</h2>
          <p className="text-zinc-400 mb-6">Accédez à votre tableau de bord</p>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400" data-testid="login-error">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                data-testid="login-email-input"
                className="h-12 bg-[#0A0A0B] border-[#27272A] focus:border-[#0066FF] focus:ring-[#0066FF]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  data-testid="login-password-input"
                  className="h-12 bg-[#0A0A0B] border-[#27272A] focus:border-[#0066FF] focus:ring-[#0066FF] pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              data-testid="login-submit-btn"
              className="w-full h-12 bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-400">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-[#0066FF] hover:underline" data-testid="register-link">
              Créer un compte
            </Link>
          </div>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-4 text-center text-xs text-zinc-500">
          <p>Demo: admin@transporter-pro.com / admin123</p>
        </div>
      </div>
      </div>
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export const RegisterPage = () => {
  const [step, setStep] = useState(1); // 1: account, 2: company (admin only), 3: redirect stripe
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // KYB fields (step 2)
  const [siret, setSiret] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tvaIntra, setTvaIntra] = useState('');
  const [address, setAddress] = useState('');
  const [siretLoading, setSiretLoading] = useState(false);
  const [siretValid, setSiretValid] = useState(null);

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  const handleVerifySiret = async () => {
    if (siret.replace(/\s/g, '').length < 14) return;
    setSiretLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/verify-siret/${siret.replace(/\s/g, '')}`);
      const data = await res.json();
      setSiretValid(data.valid);
      if (data.valid) {
        if (data.company_name) setCompanyName(data.company_name);
        if (data.address) setAddress(data.address);
      } else {
        setError(data.error || 'SIRET invalide');
      }
    } catch {
      setSiretValid(true); // fallback: accept
    }
    setSiretLoading(false);
  };

  const handleStep1 = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(email, password, name, role);
    if (result.success) {
      if (role === 'admin') {
        setStep(2); // Go to company info
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    if (!companyName || !siret || !address) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await fetch(`${API_URL}/api/onboarding/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('tp_access_token')}` },
        body: JSON.stringify({ company_name: companyName, siret: siret.replace(/\s/g, ''), tva_intra: tvaIntra, address })
      });
      // Redirect to Stripe for trial activation
      setStep(3);
      const stripeLink = 'https://buy.stripe.com/test_eVq9AUfAI9bq11R4Su7IY04';
      window.location.href = `${stripeLink}?prefilled_email=${encodeURIComponent(email)}`;
    } catch (err) {
      setError('Erreur serveur. Réessayez.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col px-4 relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1730033135158-c87def1b7af0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwyfHxsb2dpc3RpY3MlMjBkZWxpdmVyeSUyMHRydWNrJTIwbW9kZXJuJTIwbmlnaHR8ZW58MHx8fHwxNzc1MDY2MDc1fDA&ixlib=rb-4.1.0&q=85')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/90 to-[#0A0A0B]/70" />

      <div className="flex-1 flex items-center justify-center relative z-10">
        <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-[#0066FF] rounded-xl flex items-center justify-center">
            <Truck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Transporter-Pro</h1>
        </div>

        {/* Progress */}
        {role === 'admin' && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1.5 rounded-full transition-all ${s <= step ? 'bg-[#0066FF] w-8' : 'bg-zinc-700 w-4'}`} />
            ))}
          </div>
        )}

        {/* Register Card */}
        <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-8">
          {step === 1 && (
            <>
              <h2 className="text-2xl font-bold mb-2">Créer un compte</h2>
              <p className="text-zinc-400 mb-6 text-sm">30 jours d'essai gratuit</p>

              {error && (
                <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400" data-testid="register-error">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleStep1} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom complet</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jean Dupont" required data-testid="register-name-input" className="h-12 bg-[#0A0A0B] border-[#27272A]" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required data-testid="register-email-input" className="h-12 bg-[#0A0A0B] border-[#27272A]" />
                </div>
                <div className="space-y-2">
                  <Label>Mot de passe</Label>
                  <div className="relative">
                    <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required data-testid="register-password-input" className="h-12 bg-[#0A0A0B] border-[#27272A] pr-12" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Type de compte</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setRole('admin')} data-testid="register-role-admin" className={`h-12 rounded-lg border transition-colors text-sm ${role === 'admin' ? 'bg-[#0066FF]/10 border-[#0066FF] text-[#0066FF]' : 'bg-[#0A0A0B] border-[#27272A] text-zinc-400 hover:border-zinc-600'}`}>
                      Transporteur
                    </button>
                    <button type="button" onClick={() => setRole('client')} data-testid="register-role-client" className={`h-12 rounded-lg border transition-colors text-sm ${role === 'client' ? 'bg-[#0066FF]/10 border-[#0066FF] text-[#0066FF]' : 'bg-[#0A0A0B] border-[#27272A] text-zinc-400 hover:border-zinc-600'}`}>
                      Client / Chargeur
                    </button>
                  </div>
                  {role === 'admin' && <p className="text-xs text-zinc-500 mt-1">Vous pourrez inviter vos chauffeurs depuis votre dashboard.</p>}
                  {role === 'client' && <p className="text-xs text-zinc-500 mt-1">Suivi de vos expéditions en temps réel.</p>}
                </div>

                <Button type="submit" disabled={loading} data-testid="register-submit-btn" className="w-full h-12 bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold">
                  {loading ? 'Création...' : (role === 'admin' ? 'Continuer →' : 'Créer mon compte')}
                </Button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-2xl font-bold mb-2">Votre entreprise</h2>
              <p className="text-zinc-400 mb-6 text-sm">Informations légales pour la facturation</p>

              {error && (
                <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleStep2} className="space-y-4">
                <div className="space-y-2">
                  <Label>Numéro de SIRET *</Label>
                  <div className="flex gap-2">
                    <Input
                      value={siret}
                      onChange={(e) => { setSiret(e.target.value); setSiretValid(null); }}
                      placeholder="123 456 789 00012"
                      required
                      data-testid="register-siret-input"
                      className={`h-12 bg-[#0A0A0B] border-[#27272A] flex-1 ${siretValid === true ? 'border-green-500' : siretValid === false ? 'border-red-500' : ''}`}
                    />
                    <Button type="button" onClick={handleVerifySiret} disabled={siretLoading || siret.replace(/\s/g, '').length < 14} variant="outline" className="h-12 border-[#27272A] px-4" data-testid="verify-siret-btn">
                      {siretLoading ? '...' : 'Vérifier'}
                    </Button>
                  </div>
                  {siretValid === true && <p className="text-xs text-green-400">SIRET valide</p>}
                </div>

                <div className="space-y-2">
                  <Label>Nom de l'entreprise *</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Transport Express SARL" required data-testid="register-company-name" className="h-12 bg-[#0A0A0B] border-[#27272A]" />
                </div>

                <div className="space-y-2">
                  <Label>N° TVA Intracommunautaire</Label>
                  <Input value={tvaIntra} onChange={(e) => setTvaIntra(e.target.value)} placeholder="FR12345678901" data-testid="register-tva-input" className="h-12 bg-[#0A0A0B] border-[#27272A]" />
                </div>

                <div className="space-y-2">
                  <Label>Adresse du siège *</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="12 Rue de la Logistique, 75008 Paris" required data-testid="register-address-input" className="h-12 bg-[#0A0A0B] border-[#27272A]" />
                </div>

                <Button type="submit" disabled={loading} data-testid="register-kyb-submit" className="w-full h-12 bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold">
                  {loading ? 'Validation...' : 'Valider et activer l\'essai →'}
                </Button>

                <p className="text-[10px] text-zinc-600 text-center">
                  Vous serez redirigé vers Stripe pour activer votre essai gratuit de 30 jours (CB requise, débit 0€).
                </p>
              </form>
            </>
          )}

          {step === 3 && (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-zinc-400 text-sm">Redirection vers Stripe...</p>
              <p className="text-xs text-zinc-600 mt-2">Vous serez redirigé pour activer votre essai gratuit de 30 jours.</p>
            </div>
          )}

          {step === 1 && (
            <div className="mt-6 text-center text-sm text-zinc-400">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-[#0066FF] hover:underline" data-testid="login-link">Se connecter</Link>
            </div>
          )}
        </div>
      </div>
      </div>
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};
