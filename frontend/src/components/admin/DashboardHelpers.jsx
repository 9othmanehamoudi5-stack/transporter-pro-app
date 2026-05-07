import React from 'react';
import { Lock, Crown } from 'lucide-react';
import { Button } from '../ui/button';
import { useI18n } from '../../i18n/index';
import { toast } from 'sonner';

export const StatCard = ({ title, value, icon: Icon, color, pulse }) => {
  const colorClasses = {
    blue: 'text-[#0066FF] bg-[#0066FF]/10',
    green: 'text-green-400 bg-green-400/10',
    red: 'text-red-400 bg-red-400/10',
    yellow: 'text-yellow-400 bg-yellow-400/10'
  };

  return (
    <div className="bg-[#121214] border border-[#27272A] rounded-xl p-4 lg:p-6">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {pulse && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
      </div>
      <p className="text-2xl lg:text-3xl font-bold font-mono">{value}</p>
      <p className="text-sm text-zinc-400 mt-1">{title}</p>
    </div>
  );
};

export const GatedButton = ({ label, icon: Icon, feature, hasFeature, getMessage, onClick }) => {
  const locked = !hasFeature(feature);
  return (
    <button
      onClick={() => {
        if (locked) {
          toast.error(getMessage(feature));
          return;
        }
        onClick();
      }}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
        locked 
          ? 'bg-[#121214] border-[#27272A] opacity-50 cursor-not-allowed' 
          : 'bg-[#121214] border-[#27272A] hover:border-[#0066FF] hover:bg-[#0066FF]/5 cursor-pointer'
      }`}
      data-testid={`gated-${feature}`}
    >
      <div className="relative">
        <Icon className={`w-6 h-6 ${locked ? 'text-zinc-600' : 'text-[#0066FF]'}`} />
        {locked && <Lock className="w-3 h-3 text-zinc-500 absolute -bottom-1 -right-1" />}
      </div>
      <span className={`text-xs font-medium ${locked ? 'text-zinc-600' : 'text-zinc-300'}`}>{label}</span>
    </button>
  );
};

export const LockedFeatureOverlay = ({ feature, message, onUpgrade }) => {
  const { t } = useI18n();
  return (
    <div className="bg-[#121214] border border-[#27272A] rounded-2xl p-12 text-center" data-testid={`locked-${feature}`}>
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-zinc-800/50 flex items-center justify-center">
        <Lock className="w-8 h-8 text-zinc-500" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{t('common.lockedFeature', 'Fonctionnalité verrouillée')}</h3>
      <p className="text-zinc-400 mb-6 max-w-md mx-auto">{message}</p>
      <Button
        onClick={onUpgrade}
        className="bg-[#0066FF] hover:bg-[#0052CC] px-8"
        data-testid={`upgrade-from-${feature}`}
      >
        <Crown className="w-4 h-4 mr-2" />
        {t('common.changePlan', 'Changer de plan')}
      </Button>
    </div>
  );
};
