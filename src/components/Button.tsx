import type { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick: () => void;
}

export function Button({ children, onClick }: ButtonProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium transition hover:bg-zinc-200 motion-safe:active:scale-95'
    >
      {children}
    </button>
  );
}
