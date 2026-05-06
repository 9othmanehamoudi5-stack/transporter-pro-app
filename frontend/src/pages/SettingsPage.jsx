import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n/index';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
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
  Building2,
  Receipt,
  Globe,
  Image as ImageIcon,
  Bell,
  KeyRound,
  Trash2,
  ExternalLink,
  Upload,
  Activity,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';
import { useEffect } from 'react';

const PLAN_LABELS = {
  solo: 'SOLO (3 chauffeurs)',
  croissance: 'CROISSANCE (15 chauffeurs)',
  flotte_pro: 'FLOTTE PRO (illimité)',
};

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return '—';
  }
};

// ---------------- SECTION : Profile + Entreprise ----------------
const ProfileSection = ({ user, company }) => {
  const { t } = useI18n();
  const planLabel = PLAN_LABELS[user?.plan] || user?.plan || '—';
  const statusBadge =
    user?.subscription_status === 'active'
      ? { label: 'Actif', cls: 'bg-green-500/10 text-green-400 border-green-500/30' }
      : user?.subscription_status === 'trialing'
      ? { label: 'Essai en cours', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/30' }
      : { label: user?.subscription_status || '—', cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30' };

  return (
    <div className="bg-[#121214] border border-[#27272A] rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-[#27272A] flex items-center gap-3">
        <div className="w-10 h-10 bg-[#0066FF]/10 rounded-xl flex items-center justify-center">
          <UserIcon className="w-5 h-5 text-[#0066FF]" />
        </div>
        <div>
          <h2 className="font-semibold text-white">{t('settings.profile', 'Mon profil')}</h2>
          <p className="text-xs text-zinc-500">{t('settings.profileDesc', "Informations d'inscription et entreprise")}</p>
        </div>
      </div>
      <div className="p-6 grid sm:grid-cols-2 gap-5">
        <Field icon={Mail} label="Email" value={user?.email} testid="profile-email" />
        <Field icon={UserIcon} label="Nom" value={user?.name} testid="profile-name" />
        <Field icon={Shield} label="Plan" value={planLabel} testid="profile-plan" />
        <div>
          <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5">Statut</p>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusBadge.cls}`}
            data-testid="profile-subscription-status"
          >
            <CheckCircle2 className="w-3 h-3" /> {statusBadge.label}
          </span>
        </div>
        <Field icon={Calendar} label="Date d'inscription" value={formatDate(user?.created_at)} testid="profile-created" />
        <Field icon={Building2} label="Raison sociale" value={company?.company_name || '—'} testid="company-name" />
        <Field label="SIRET" value={company?.siret || '—'} mono testid="company-siret" />
        <Field label="TVA Intra" value={company?.tva_intra || '—'} mono testid="company-tva" />
        <div className="sm:col-span-2">
          <Field label="Adresse du siège" value={company?.address || '—'} testid="company-address" />
        </div>
      </div>
    </div>
  );
};

const Field = ({ icon: Icon, label, value, mono = false, testid }) => (
  <div>
    <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5 flex items-center gap-1.5">
      {Icon && <Icon className="w-3.5 h-3.5" />} {label}
    </p>
    <p className={`text-white font-medium ${mono ? 'font-mono text-sm' : ''}`} data-testid={testid}>
      {value}
    </p>
  </div>
);

// ---------------- SECTION : Services & Facturation ----------------
const BillingSection = ({ user, refreshUser }) => {
  const { t, lang, setLang } = useI18n();
  const [openingPortal, setOpeningPortal] = useState(false);
  const [savingLang, setSavingLang] = useState(false);

  const handleOpenPortal = async () => {
    setOpeningPortal(true);
    try {
      const { data } = await api.post('/billing/portal');
      window.location.href = data.url;
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erreur Stripe');
      setOpeningPortal(false);
    }
  };

  const handleLangChange = async (newLang) => {
    setSavingLang(true);
    try {
      await api.patch('/settings/preferences', { language: newLang });
      setLang?.(newLang);
      toast.success('Langue mise à jour');
      refreshUser?.();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Erreur');
    }
    setSavingLang(false);
  };

  return (
    <div className="bg-[#121214] border border-[#27272A] rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-[#27272A] flex items-center gap-3">
        <div className="w-10 h-10 bg-[#0066FF]/10 rounded-xl flex items-center justify-center">
          <Receipt className="w-5 h-5 text-[#0066FF]" />
        </div>
        <div>
          <h2 className="font-semibold text-white">{t('settings.billing', 'Services & Facturation')}</h2>
          <p className="text-xs text-zinc-500">{t('settings.billingDesc', "Stripe, langue de l'interface")}</p>
        </div>
      </div>
      <div className="p-6 space-y-5">
        <div>
          <p className="text-sm text-zinc-300 mb-2 font-medium">{t('settings.manageBilling', 'Portail de facturation Stripe')}</p>
          <p className="text-xs text-zinc-500 mb-3 max-w-md">
            {t('settings.billingDesc2', 'Téléchargez vos factures, mettez à jour votre carte, changez de plan ou résiliez votre abonnement en self-service.')}
          </p>
          <Button
            onClick={handleOpenPortal}
            disabled={openingPortal}
            className="bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl"
            data-testid="open-billing-portal-btn"
          >
            {openingPortal ? '…' : t('settings.manageBilling', 'Gérer ma facturation')}
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="border-t border-[#27272A] pt-5">
          <Label className="text-zinc-300 mb-2 block flex items-center gap-2">
            <Globe className="w-4 h-4" /> {t('settings.language', "Langue de l'interface")}
          </Label>
          <Select value={lang || user?.language || 'fr'} onValueChange={handleLangChange} disabled={savingLang}>
            <SelectTrigger className="w-56 bg-[#0A0A0B] border-[#27272A]" data-testid="lang-select-trigger">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#121214] border-[#27272A]">
              <SelectItem value="fr">🇫🇷 Français</SelectItem>
              <SelectItem value="en">🇬🇧 English</SelectItem>
              <SelectItem value="es">🇪🇸 Español</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

// ---------------- SECTION : Personnalisation ----------------
const CustomizationSection = ({ user, refreshUser }) => {
  const { t } = useI18n();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [logo, setLogo] = useState(user?.logo_base64 || '');
  const [prefs, setPrefs] = useState(user?.notification_prefs || {
    new_dispute: true,
    weekly_eco: true,
    quota_alert: true,
  });

  useEffect(() => {
    setLogo(user?.logo_base64 || '');
    if (user?.notification_prefs) setPrefs(user.notification_prefs);
  }, [user]);

  const handleLogoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) {
      toast.error('Logo trop lourd (max 500 KB)');
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      toast.error('Format invalide (PNG / JPEG / WEBP / SVG)');
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await api.post('/settings/logo', { logo_base64: reader.result });
        setLogo(reader.result);
        toast.success('Logo enregistré');
        refreshUser?.();
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Erreur upload');
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    try {
      await api.delete('/settings/logo');
      setLogo('');
      toast.success('Logo supprimé');
      refreshUser?.();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const togglePref = async (key) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    try {
      await api.patch('/settings/preferences', { notification_prefs: updated });
      refreshUser?.();
    } catch (err) {
      toast.error('Erreur sauvegarde');
      setPrefs(prefs); // rollback
    }
  };

  return (
    <div className="bg-[#121214] border border-[#27272A] rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-[#27272A] flex items-center gap-3">
        <div className="w-10 h-10 bg-[#0066FF]/10 rounded-xl flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-[#0066FF]" />
        </div>
        <div>
          <h2 className="font-semibold text-white">{t('settings.customization', 'Personnalisation & Alertes')}</h2>
          <p className="text-xs text-zinc-500">{t('settings.customizationDesc', 'Logo entreprise + notifications')}</p>
        </div>
      </div>
      <div className="p-6 space-y-6">
        {/* Logo */}
        <div>
          <Label className="text-zinc-300 mb-3 block">Logo entreprise (sidebar + futurs e-CMR PDF)</Label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-[#0A0A0B] border border-[#27272A] flex items-center justify-center overflow-hidden">
              {logo ? (
                <img src={logo} alt="Logo" className="w-full h-full object-contain" data-testid="logo-preview" />
              ) : (
                <ImageIcon className="w-8 h-8 text-zinc-600" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleLogoFile} className="hidden" data-testid="logo-input" />
              <Button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                variant="outline"
                className="border-[#27272A] text-white hover:bg-[#1A1A1E]"
                data-testid="upload-logo-btn"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Envoi…' : logo ? 'Changer le logo' : 'Choisir un logo'}
              </Button>
              {logo && (
                <Button
                  type="button"
                  onClick={handleRemoveLogo}
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  data-testid="remove-logo-btn"
                >
                  Supprimer
                </Button>
              )}
              <p className="text-[11px] text-zinc-500">PNG / JPEG / WEBP / SVG · max 500 KB</p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="border-t border-[#27272A] pt-6">
          <p className="text-sm text-zinc-300 font-medium mb-1 flex items-center gap-2">
            <Bell className="w-4 h-4" /> Préférences de notification
          </p>
          <p className="text-xs text-zinc-500 mb-4">Email envoyé pour chaque événement activé.</p>
          <div className="space-y-3">
            <PrefRow label="Nouveau litige détecté" desc="Email instantané dès qu'un dommage est signalé" checked={prefs.new_dispute} onChange={() => togglePref('new_dispute')} testid="pref-new-dispute" />
            <PrefRow label="Rapport hebdomadaire Éco-score" desc="Lundi matin — synthèse de la semaine de vos chauffeurs" checked={prefs.weekly_eco} onChange={() => togglePref('weekly_eco')} testid="pref-weekly-eco" />
            <PrefRow label="Alerte quota chauffeurs" desc="Quand vous atteignez 80% / 100% de votre quota du plan" checked={prefs.quota_alert} onChange={() => togglePref('quota_alert')} testid="pref-quota-alert" />
          </div>
        </div>
      </div>
    </div>
  );
};

const PrefRow = ({ label, desc, checked, onChange, testid }) => (
  <label className="flex items-center justify-between gap-4 cursor-pointer hover:bg-[#1A1A1E]/50 -mx-2 px-2 py-2 rounded-lg transition-colors">
    <div className="flex-1">
      <p className="text-sm text-white font-medium">{label}</p>
      <p className="text-xs text-zinc-500">{desc}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} data-testid={testid} />
  </label>
);

// ---------------- SECTION : Sécurité ----------------
const SecuritySection = ({ user, refreshUser, logout }) => {
  const { t } = useI18n();
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [twoFa, setTwoFa] = useState(!!user?.['2fa_enabled']);
  const [delPwd, setDelPwd] = useState('');
  const [delConfirm, setDelConfirm] = useState('');
  const [delOpen, setDelOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setTwoFa(!!user?.['2fa_enabled']);
  }, [user]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    if (newPwd.length < 8) return setPwdError('Minimum 8 caractères');
    if (newPwd !== confirmPwd) return setPwdError('Les deux mots de passe ne correspondent pas');
    if (currentPwd === newPwd) return setPwdError('Le nouveau mot de passe doit être différent');
    setLoading(true);
    try {
      await api.post('/auth/change-password', { current_password: currentPwd, new_password: newPwd });
      toast.success('Mot de passe modifié');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string'
        ? detail
        : err.response?.status === 401
        ? 'Session expirée — reconnectez-vous'
        : err.message || 'Erreur réseau';
      setPwdError(msg);
    }
    setLoading(false);
  };

  const handleToggle2FA = async (next) => {
    if (next) {
      const ok = window.confirm(
        "⚠️ Activation de la 2FA par email\n\n" +
        "À chaque connexion, un code à 6 chiffres sera envoyé à " + (user?.email || '') + ".\n\n" +
        "IMPORTANT : si Resend est en mode test ou si votre domaine n'est pas vérifié, " +
        "vous risquez de ne pas recevoir l'email et d'être bloqué.\n\n" +
        "Confirmez-vous l'activation ?"
      );
      if (!ok) return;
    }
    setTwoFa(next);
    try {
      await api.patch('/settings/preferences', { two_fa_enabled: next });
      toast.success(next ? '2FA activée' : '2FA désactivée');
      refreshUser?.();
    } catch (err) {
      toast.error('Erreur sauvegarde');
      setTwoFa(!next);
    }
  };

  const handleDeleteAccount = async () => {
    if (delConfirm !== 'SUPPRIMER') {
      toast.error('Tapez "SUPPRIMER" pour confirmer');
      return;
    }
    if (!delPwd) {
      toast.error('Mot de passe requis');
      return;
    }
    setDeleting(true);
    try {
      await api.delete('/auth/account', { data: { password: delPwd, confirmation: 'SUPPRIMER' } });
      toast.success('Compte supprimé. Déconnexion…');
      setTimeout(() => {
        localStorage.clear();
        window.location.href = '/login';
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur suppression');
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Change password */}
      <div className="bg-[#121214] border border-[#27272A] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#27272A] flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0066FF]/10 rounded-xl flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#0066FF]" />
          </div>
          <div>
            <h2 className="font-semibold text-white">{t('settings.changePassword', 'Changer mon mot de passe')}</h2>
            <p className="text-xs text-zinc-500">{t('settings.minChars', 'Minimum 8 caractères')}</p>
          </div>
        </div>
        <form onSubmit={handleChangePassword} className="p-6 space-y-4 max-w-md">
          {pwdError && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400" data-testid="change-pwd-error">
              <AlertCircle className="w-5 h-5 flex-shrink-0" /> <span className="text-sm">{pwdError}</span>
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-zinc-300">Mot de passe actuel</Label>
            <div className="relative">
              <Input type={showPwd ? 'text' : 'password'} value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} required className="h-12 bg-[#0A0A0B] border-[#27272A] pr-12" data-testid="settings-current-password" />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Nouveau mot de passe</Label>
            <Input type={showPwd ? 'text' : 'password'} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required minLength={8} className="h-12 bg-[#0A0A0B] border-[#27272A]" data-testid="settings-new-password" />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Confirmer</Label>
            <Input type={showPwd ? 'text' : 'password'} value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} required minLength={8} className="h-12 bg-[#0A0A0B] border-[#27272A]" data-testid="settings-confirm-password" />
          </div>
          <Button type="submit" disabled={loading || !currentPwd || !newPwd || !confirmPwd} className="h-11 px-5 bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold rounded-xl" data-testid="settings-change-pwd-btn">
            {loading ? 'Modification…' : 'Modifier mon mot de passe'}
          </Button>
        </form>
      </div>

      {/* 2FA */}
      <div className="bg-[#121214] border border-[#27272A] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#27272A] flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0066FF]/10 rounded-xl flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-[#0066FF]" />
          </div>
          <div>
            <h2 className="font-semibold text-white">{t('settings.twofa', 'Double authentification (2FA)')}</h2>
            <p className="text-xs text-zinc-500">{t('settings.twofaDesc', 'Code à 6 chiffres envoyé par email à chaque connexion')}</p>
          </div>
        </div>
        <div className="p-6">
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <p className="text-sm text-white font-medium">Activer la 2FA par email</p>
              <p className="text-xs text-zinc-500">Recommandé pour les comptes sensibles</p>
            </div>
            <Switch checked={twoFa} onCheckedChange={handleToggle2FA} data-testid="toggle-2fa" />
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-[#1A0F11] border border-red-500/30 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-red-500/20 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="font-semibold text-red-300">{t('settings.danger', 'Zone de danger')}</h2>
            <p className="text-xs text-red-400/70">{t('settings.dangerDesc', 'Action irréversible')}</p>
          </div>
        </div>
        <div className="p-6">
          <p className="text-sm text-zinc-300 mb-1">{t('settings.deleteAccount', 'Supprimer définitivement mon compte')}</p>
          <p className="text-xs text-zinc-500 mb-4 max-w-md">
            Cette action résilie immédiatement votre abonnement Stripe, supprime toutes les données associées et bloque toute nouvelle connexion avec cet email.
          </p>
          <Dialog open={delOpen} onOpenChange={setDelOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200" data-testid="open-delete-account-btn">
                <Trash2 className="w-4 h-4 mr-2" /> Supprimer mon compte
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#121214] border border-red-500/30 text-white">
              <DialogHeader>
                <DialogTitle className="text-red-300">Suppression définitive de votre compte</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm text-red-300">
                  <p className="font-semibold mb-1">⚠️ Cette action est irréversible.</p>
                  <ul className="text-xs text-red-200/80 space-y-1 list-disc pl-4 mt-2">
                    <li>Votre abonnement Stripe sera résilié immédiatement</li>
                    <li>Toutes vos livraisons, factures et chauffeurs seront archivés</li>
                    <li>Vous ne pourrez plus jamais vous reconnecter avec <strong>{user?.email}</strong></li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Mot de passe actuel</Label>
                  <Input type="password" value={delPwd} onChange={(e) => setDelPwd(e.target.value)} className="bg-[#0A0A0B] border-[#27272A]" data-testid="delete-account-password" />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">
                    Tapez <strong className="text-red-400 font-mono">SUPPRIMER</strong> pour confirmer
                  </Label>
                  <Input value={delConfirm} onChange={(e) => setDelConfirm(e.target.value)} placeholder="SUPPRIMER" className="bg-[#0A0A0B] border-[#27272A] font-mono" data-testid="delete-account-confirm" />
                </div>
                <Button
                  onClick={handleDeleteAccount}
                  disabled={deleting || delConfirm !== 'SUPPRIMER' || !delPwd}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  data-testid="confirm-delete-account-btn"
                >
                  {deleting ? 'Suppression…' : 'Confirmer la suppression définitive'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
};

// ---------------- SECTION : Activité du compte ----------------
const ACTION_LABELS = {
  login: { label: 'Connexion', color: 'text-zinc-400' },
  register: { label: 'Création de compte', color: 'text-blue-400' },
  onboarding_complete: { label: 'Onboarding KYB', color: 'text-blue-400' },
  password_reset_requested: { label: 'Réinitialisation mot de passe demandée', color: 'text-amber-400' },
  password_reset_completed: { label: 'Mot de passe réinitialisé', color: 'text-green-400' },
  password_changed: { label: 'Mot de passe modifié', color: 'text-green-400' },
  '2fa_verified': { label: '2FA validée', color: 'text-green-400' },
  settings_updated: { label: 'Paramètres modifiés', color: 'text-zinc-400' },
  logo_updated: { label: 'Logo mis à jour', color: 'text-zinc-400' },
  stripe_payment: { label: 'Paiement Stripe', color: 'text-green-400' },
  manual_subscription_activation: { label: 'Activation manuelle', color: 'text-amber-400' },
  account_deleted: { label: 'Suppression de compte', color: 'text-red-400' },
  delivery_created: { label: 'Livraison créée', color: 'text-blue-400' },
  driver_added: { label: 'Chauffeur ajouté', color: 'text-blue-400' },
  driver_deleted: { label: 'Chauffeur supprimé', color: 'text-red-400' },
};

const formatDateTime = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
};

const ActivitySection = () => {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get('/account/activity?limit=50')
      .then((r) => mounted && setItems(r.data.items || []))
      .catch(() => mounted && setItems([]))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  return (
    <div className="bg-[#121214] border border-[#27272A] rounded-2xl overflow-hidden" data-testid="activity-section">
      <div className="p-6 border-b border-[#27272A] flex items-center gap-3">
        <div className="w-10 h-10 bg-[#0066FF]/10 rounded-xl flex items-center justify-center">
          <Activity className="w-5 h-5 text-[#0066FF]" />
        </div>
        <div>
          <h2 className="font-semibold text-white">{t('settings.activity', 'Activité du compte')}</h2>
          <p className="text-xs text-zinc-500">{t('settings.activityDesc', '50 derniers événements (conformité RGPD/SOC2)')}</p>
        </div>
      </div>
      <div className="divide-y divide-[#27272A] max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-zinc-500 text-sm">Chargement…</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-zinc-500 text-sm">Aucune activité enregistrée</div>
        ) : (
          items.map((item, idx) => {
            const meta = ACTION_LABELS[item.action] || { label: item.action.replace(/_/g, ' '), color: 'text-zinc-400' };
            return (
              <div key={idx} className="p-4 hover:bg-[#1A1A1E]/50 transition-colors flex items-start gap-3" data-testid={`activity-item-${idx}`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${meta.color.replace('text-', 'bg-')}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className={`text-sm font-medium ${meta.color}`}>{meta.label}</p>
                    <span className="text-[11px] text-zinc-500 font-mono whitespace-nowrap flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDateTime(item.created_at)}
                    </span>
                  </div>
                  {item.details && (
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{item.details}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// ---------------- MAIN ----------------
const SettingsPage = () => {
  const { user, logout, checkAuth } = useAuth();
  const { t, locale, changeLocale } = useI18n();
  const [company, setCompany] = useState(null);

  // Sync UI locale to user.language on first load (so reload restores user's chosen lang)
  useEffect(() => {
    if (user?.language && ['fr', 'en', 'es'].includes(user.language) && user.language !== locale) {
      changeLocale(user.language);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.language]);

  const refreshUser = async () => {
    try {
      await checkAuth?.();
    } catch {}
  };

  useEffect(() => {
    let mounted = true;
    api.get('/company')
      .then((r) => mounted && setCompany(r.data))
      .catch(() => mounted && setCompany(null));
    return () => { mounted = false; };
  }, [user?.id]);

  return (
    <div className="space-y-6" data-testid="settings-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{t('settings.title', 'Paramètres')}</h1>
        <p className="text-sm text-zinc-400 mt-1">{t('settings.subtitle', 'Profil, entreprise, facturation, personnalisation et sécurité.')}</p>
      </div>
      <ProfileSection user={user} company={company} />
      <BillingSection user={user} refreshUser={refreshUser} />
      <CustomizationSection user={user} refreshUser={refreshUser} />
      <SecuritySection user={user} refreshUser={refreshUser} logout={logout} />
      <ActivitySection />
    </div>
  );
};

export default SettingsPage;
