import {
  Check,
  CheckCheck,
  type LucideIcon,
  TriangleAlert,
  X,
} from 'lucide-react';
import { getStrength, type Strength } from './levels';

const STRENGTH_STYLES: Record<
  Strength,
  { label: string; icon: LucideIcon; className: string }
> = {
  poor: {
    label: 'Poor',
    icon: X,
    className: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  },
  weak: {
    label: 'Weak',
    icon: TriangleAlert,
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  },
  good: {
    label: 'Good',
    icon: Check,
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  excellent: {
    label: 'Excellent',
    icon: CheckCheck,
    className: 'bg-emerald-100 text-emerald-800 ring-emerald-600/30',
  },
};

interface StrengthBadgeProps {
  bits: number;
}

export function StrengthBadge({ bits }: StrengthBadgeProps) {
  const style = STRENGTH_STYLES[getStrength(bits)];
  const Icon = style.icon;

  return (
    <p
      title={`${Math.round(bits)} bits of entropy`}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 transition-colors duration-300 ring-inset ${style.className}`}
    >
      <span className='sr-only'>Password strength:</span>
      <Icon className='size-3.5' />
      <span>{style.label}</span>
    </p>
  );
}
