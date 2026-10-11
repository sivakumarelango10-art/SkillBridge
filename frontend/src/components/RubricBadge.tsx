import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle, ClockCountdown, WarningCircle, Sparkle } from '@phosphor-icons/react';

export type CriterionLevel = 'Not yet' | 'Partly meets' | 'Mostly meets' | 'Meets';

interface RubricBadgeProps {
  level: CriterionLevel | string;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
}

export const RubricBadge: React.FC<RubricBadgeProps> = ({
  level,
  size = 'md',
  showDescription = false,
}) => {
  const normalized = (level || 'Not yet') as CriterionLevel;

  const config = {
    'Meets': {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: <CheckCircle className="text-emerald-600" weight="fill" />,
      subtext: 'Demonstrates competent workplace execution on this challenge.',
    },
    'Mostly meets': {
      bg: 'bg-[#EBF7FD] text-[#1E678F] border-[#B5E2FA]',
      icon: <Sparkle className="text-[#38A0D8]" weight="fill" />,
      subtext: 'Meets primary requirements with minor adjustments recommended.',
    },
    'Partly meets': {
      bg: 'bg-[#FFF6ED] text-[#B8550B] border-[#FCD5B5]',
      icon: <WarningCircle className="text-[#E57116]" weight="fill" />,
      subtext: 'Core elements present; requires specific formula/analysis revisions.',
    },
    'Not yet': {
      bg: 'bg-slate-100 text-slate-700 border-slate-300',
      icon: <ClockCountdown className="text-slate-500" weight="bold" />,
      subtext: 'Fundamental steps need rework before resubmitting.',
    },
  }[normalized] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-300',
    icon: <ClockCountdown className="text-slate-500" weight="bold" />,
    subtext: 'Evaluation pending review.',
  };

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
    lg: 'text-base px-4 py-2 gap-2.5 font-semibold',
  }[size];

  return (
    <div className="inline-flex flex-col">
      <motion.span
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className={`inline-flex items-center rounded-full border shadow-sm ${sizeClasses} ${config.bg}`}
      >
        <span className="text-base shrink-0">{config.icon}</span>
        <span>{normalized}</span>
      </motion.span>
      {showDescription && (
        <span className="text-xs text-slate-500 mt-1 max-w-[240px]">
          {config.subtext}
        </span>
      )}
    </div>
  );
};
