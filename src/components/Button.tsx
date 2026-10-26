import type { ComponentPropsWithoutRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'danger-subtle';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700',
  secondary:
    'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  'danger-subtle':
    'text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50',
};

// Accepts every attribute of a <button> except className: buttons always
// look the same, and the parent decides their width and position
interface ButtonProps extends Omit<
  ComponentPropsWithoutRef<'button'>,
  'className' | 'type'
> {
  variant?: ButtonVariant;
  // 'button' by default, so a button never submits a form by accident
  type?: 'button' | 'submit';
}

export function Button({
  variant = 'secondary',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      {...props}
      className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 motion-safe:active:scale-95 ${VARIANTS[variant]}`}
    />
  );
}
