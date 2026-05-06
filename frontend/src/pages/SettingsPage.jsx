import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import {
  User as UserIcon,
  Mail,
  Shield,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

const PLAN_LABELS = {
  solo: 'SOLO (3 chauffeurs)',
  croissance: 'CROISSANCE (15 chauffeurs)',
  flotte_pro: 'FLOTTE PRO (illimité)',
};

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return '—';
  }
};

const SettingsPage = () => {
  const { user } = useAuth();
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPwd.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (newPwd !== confirmPwd) {
      setError('Les deux mots de passe ne correspondent pas');
      return;
    }
    if (currentPwd === newPwd) {
      setError('Le nouveau mot de passe doit être différent de l\'actuel');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password', { current_password: currentPwd, new_password: newPwd });
      toast.success('Mot de passe modifié avec succès');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur réseau. Réessayez.');
    }
    setLoading(false);
  };

  const planLabel = PLAN_LABELS[user?.plan] || user?.plan || '—';
  const statusBadge = user?.subscription_status === 'active'
    ? { label: 'Actif', cls: 'bg-green-500/10 text-green-400 border-green-500/30' }
    : user?.subscription_status === 'trialing'
    ? { label: 'Essai en cours', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/30' }
    : { label: user?.subscription_status || '—', cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30' };

  return (
    <div className="space-y-6" data-testid="settings-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Paramètres</h1>
        <p className="text-sm text-zinc-400 mt-1">Gérez votre compte et votre sécurité.</p>
      </div>

      {/* Profile card */}
      <div className="bg-[#121214] border border-[#27272A] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#27272A] flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0066FF]/10 rounded-xl flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-[#0066FF]" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Mon profil</h2>
            <p className="text-xs text-zinc-500">Informations d'inscription</p>
          </div>
        </div>
        <div className="p-6 grid sm:grid-cols-2 gap-5">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email
            </p>
            <p className="text-white font-medium" data-testid="profile-email">{user?.email || '—'}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5" /> Nom
            </p>
            <p className="text-white font-medium" data-testid="profile-name">{user?.name || '—'}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Plan
            </p>
            <p className="text-white font-medium" data-testid="profile-plan">{planLabel}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5">Statut abonnement</p>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusBadge.cls}`}
              data-testid="profile-subscription-status"
            >
              <CheckCircle2 className="w-3 h-3" /> {statusBadge.label}
            </span>
          </div>
          <div className="sm:col-span-2">
            <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Date d'inscription
            </p>
            <p className="text-white font-medium" data-testid="profile-created">
              {formatDate(user?.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Change password card */}
      <div className="bg-[#121214] border border-[#27272A] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#27272A] flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0066FF]/10 rounded-xl flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#0066FF]" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Changer mon mot de passe</h2>
            <p className="text-xs text-zinc-500">Minimum 8 caractères. Vous serez déconnecté des autres sessions.</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="p-6 space-y-4 max-w-md">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400" data-testid="change-pwd-error">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-zinc-300">Mot de passe actuel</Label>
            <div className="relative">
              <Input
                type={showPwd ? 'text' : 'password'}
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                placeholder="••••••••"
                required
                className="h-12 bg-[#0A0A0B] border-[#27272A] pr-12"
                data-testid="settings-current-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                aria-label="Afficher le mot de passe"
              >
                {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Nouveau mot de passe</Label>
            <Input
              type={showPwd ? 'text' : 'password'}
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="Minimum 8 caractères"
              required
              minLength={8}
              className="h-12 bg-[#0A0A0B] border-[#27272A]"
              data-testid="settings-new-password"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Confirmer</Label>
            <Input
              type={showPwd ? 'text' : 'password'}
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              placeholder="Re-saisissez le nouveau mot de passe"
              required
              minLength={8}
              className="h-12 bg-[#0A0A0B] border-[#27272A]"
              data-testid="settings-confirm-password"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !currentPwd || !newPwd || !confirmPwd}
            className="h-11 px-5 bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold rounded-xl"
            data-testid="settings-change-pwd-btn"
          >
            {loading ? 'Modification...' : 'Modifier mon mot de passe'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
