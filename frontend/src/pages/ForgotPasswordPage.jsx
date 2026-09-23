import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import api from '../services/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur réseau. Réessayez.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0A0A0B] relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1610793148376-2b2b64b1bbb6?w=800&q=80')` }} />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/95 to-[#0A0A0B]/80" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-[#0066FF] rounded-xl flex items-center justify-center">
            <Truck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Transporter-Pro</h1>
        </div>

        <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-8">
          {submitted ? (
            <div className="text-center" data-testid="forgot-success">
              <div className="w-14 h-14 mx-auto mb-5 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Vérifiez votre boîte mail</h2>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                Si un compte existe avec <strong className="text-white">{email}</strong>, vous recevrez un lien
                de réinitialisation dans quelques secondes. Le lien expire dans <strong className="text-white">15 minutes</strong>.
              </p>
              <Link to="/login" className="inline-flex items-center gap-2 text-sm text-[#0066FF] hover:underline" data-testid="back-to-login">
                <ArrowLeft className="w-4 h-4" /> Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">Mot de passe oublié</h2>
              <p className="text-sm text-zinc-400 mb-6">
                Saisissez votre email — nous vous enverrons un lien sécurisé pour le réinitialiser.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Adresse email</Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      required
                      className="h-12 bg-[#0A0A0B] border-[#27272A] pl-10"
                      data-testid="forgot-email-input"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full h-12 bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold rounded-xl"
                  data-testid="forgot-submit-btn"
                >
                  {loading ? 'Envoi...' : 'Envoyer le lien'}
                </Button>
              </form>
              <div className="mt-6 text-center text-sm text-zinc-400">
                <Link to="/login" className="text-[#0066FF] hover:underline inline-flex items-center gap-1" data-testid="forgot-back-link">
                  <ArrowLeft className="w-4 h-4" /> Retour à la connexion
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
