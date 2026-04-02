import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Truck, AlertCircle, Eye, EyeOff } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1730033135158-c87def1b7af0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwyfHxsb2dpc3RpY3MlMjBkZWxpdmVyeSUyMHRydWNrJTIwbW9kZXJuJTIwbmlnaHR8ZW58MHx8fHwxNzc1MDY2MDc1fDA&ixlib=rb-4.1.0&q=85')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/90 to-[#0A0A0B]/70" />

      <div className="w-full max-w-md relative z-10">
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
  );
};

export const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('client');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(email, password, name, role);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1730033135158-c87def1b7af0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwyfHxsb2dpc3RpY3MlMjBkZWxpdmVyeSUyMHRydWNrJTIwbW9kZXJuJTIwbmlnaHR8ZW58MHx8fHwxNzc1MDY2MDc1fDA&ixlib=rb-4.1.0&q=85')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/90 to-[#0A0A0B]/70" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-[#0066FF] rounded-xl flex items-center justify-center">
            <Truck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Transporter-Pro</h1>
        </div>

        {/* Register Card */}
        <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-2">Créer un compte</h2>
          <p className="text-zinc-400 mb-6">Rejoignez Transporter-Pro</p>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400" data-testid="register-error">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jean Dupont"
                required
                data-testid="register-name-input"
                className="h-12 bg-[#0A0A0B] border-[#27272A] focus:border-[#0066FF] focus:ring-[#0066FF]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                data-testid="register-email-input"
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
                  data-testid="register-password-input"
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

            <div className="space-y-2">
              <Label>Type de compte</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('client')}
                  data-testid="register-role-client"
                  className={`h-12 rounded-lg border transition-colors ${
                    role === 'client' 
                      ? 'bg-[#0066FF]/10 border-[#0066FF] text-[#0066FF]' 
                      : 'bg-[#0A0A0B] border-[#27272A] text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  Client
                </button>
                <button
                  type="button"
                  onClick={() => setRole('driver')}
                  data-testid="register-role-driver"
                  className={`h-12 rounded-lg border transition-colors ${
                    role === 'driver' 
                      ? 'bg-[#0066FF]/10 border-[#0066FF] text-[#0066FF]' 
                      : 'bg-[#0A0A0B] border-[#27272A] text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  Chauffeur
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              data-testid="register-submit-btn"
              className="w-full h-12 bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold"
            >
              {loading ? 'Création...' : 'Créer mon compte'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-400">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-[#0066FF] hover:underline" data-testid="login-link">
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
