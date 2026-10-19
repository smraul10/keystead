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
      className='flex items-center justify-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-emerald-600 cursor-pointer'
    >
      {children}
    </button>
  );
}
