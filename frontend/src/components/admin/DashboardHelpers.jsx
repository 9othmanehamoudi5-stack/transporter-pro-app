import React from 'react';
import { Lock, Crown } from 'lucide-react';
import { Button } from '../ui/button';
import { useI18n } from '../../i18n/index';
import { toast } from 'sonner';

export const StatCard = ({ title, value, icon: Icon, color = 'blue', pulse, subtext, badge, trend }) => {
  const colorStyles = {
    blue: {
      icon: 'text-[#0066FF] bg-[#0066FF]/10 border-[#0066FF]/20',
      glow: 'from-[#0066FF]/30 to-transparent',
      badge: 'bg-[#0066FF]/10 text-[#0066FF] border-[#0066FF]/30'
    },
    green: {
      icon: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      glow: 'from-emerald-500/30 to-transparent',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    },
    red: {
      icon: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      glow: 'from-rose-500/30 to-transparent',
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
    },
    yellow: {
      icon: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      glow: 'from-amber-500/30 to-transparent',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    }
  };

  const currentStyle = colorStyles[color] || colorStyles.blue;

  return (
    <div className="bg-[#121214] border border-[#27272A] hover:border-zinc-700/80 rounded-2xl p-5 transition-all duration-200 relative group overflow-hidden shadow-sm flex flex-col justify-between">
      {/* Top micro-gradient border line */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${currentStyle.glow} opacity-60 group-hover:opacity-100 transition-opacity`} />
      
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${currentStyle.icon} transition-transform group-hover:scale-105 duration-200`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-1.5">
            {badge && (
              <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border ${currentStyle.badge}`}>
                {badge}
              </span>
            )}
            {pulse && (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            )}
          </div>
        </div>

        <p className="text-2xl lg:text-3xl font-extrabold font-mono tracking-tight text-white">
          {value}
        </p>
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mt-1.5">
          {title}
        </p>
      </div>

      {subtext && (
        <p className="text-xs text-zinc-500 mt-3 pt-2.5 border-t border-[#27272A]/70 flex items-center justify-between">
          <span>{subtext}</span>
          {trend && <span className="font-mono text-zinc-400 text-[11px]">{trend}</span>}
        </p>
      )}
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
      className={`flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl border transition-all duration-200 group active:scale-[0.98] ${
        locked 
          ? 'bg-[#121214] border-[#27272A] opacity-50 cursor-not-allowed' 
          : 'bg-[#121214] border-[#27272A] hover:border-[#0066FF]/60 hover:bg-[#1A1A1E] cursor-pointer shadow-sm'
      }`}
      data-testid={`gated-${feature}`}
    >
      <div className="relative">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-colors ${
          locked 
            ? 'bg-zinc-900 border-zinc-800 text-zinc-600' 
            : 'bg-[#1A1A1E] border-[#27272A] text-[#0066FF] group-hover:border-[#0066FF]/40 group-hover:bg-[#0066FF]/10'
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        {locked && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center">
            <Lock className="w-2.5 h-2.5 text-zinc-400" />
          </span>
        )}
      </div>
      <span className={`text-xs font-semibold tracking-wide ${locked ? 'text-zinc-600' : 'text-zinc-300 group-hover:text-white transition-colors'}`}>
        {label}
      </span>
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
