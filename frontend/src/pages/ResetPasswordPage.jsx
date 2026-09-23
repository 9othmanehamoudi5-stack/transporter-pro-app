import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Truck, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import api from '../services/api';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) setError('Lien de réinitialisation invalide ou incomplet');
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (newPassword !== confirm) {
      setError('Les deux mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, new_password: newPassword });
      setSuccess(true);
      toast.success('Mot de passe modifié avec succès');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur réseau. Réessayez.');
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
          {success ? (
            <div className="text-center" data-testid="reset-success">
              <div className="w-14 h-14 mx-auto mb-5 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Mot de passe modifié</h2>
              <p className="text-sm text-zinc-400 mb-6">Redirection vers la connexion…</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">Nouveau mot de passe</h2>
              <p className="text-sm text-zinc-400 mb-6">Choisissez un mot de passe d'au moins 8 caractères.</p>

              {error && (
                <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400" data-testid="reset-error">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <Input
                      type={showPwd ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 caractères"
                      required
                      minLength={8}
                      className="h-12 bg-[#0A0A0B] border-[#27272A] pl-10 pr-12"
                      data-testid="reset-new-password"
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                      {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Confirmer</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <Input
                      type={showPwd ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Re-saisissez le mot de passe"
                      required
                      minLength={8}
                      className="h-12 bg-[#0A0A0B] border-[#27272A] pl-10"
                      data-testid="reset-confirm-password"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full h-12 bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold rounded-xl"
                  data-testid="reset-submit-btn"
                >
                  {loading ? 'Validation...' : 'Modifier mon mot de passe'}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-zinc-400">
                <Link to="/login" className="text-[#0066FF] hover:underline">Retour à la connexion</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
