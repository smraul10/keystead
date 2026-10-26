import { LockKeyhole } from 'lucide-react';
import type { ReactNode } from 'react';

interface CardScreenProps {
  // Under the app's name: what this screen is for
  subtitle: string;
  children: ReactNode;
}

// The whole window, with a centered card under the app's logo and name: the
// screens shown while the vault isn't open (create it, unlock it...)
export function CardScreen({ subtitle, children }: CardScreenProps) {
  return (
    <main className='flex min-h-screen items-center justify-center bg-zinc-100 p-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100'>
      <div className='flex w-full max-w-sm flex-col gap-5 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900'>
        <div className='flex flex-col items-center gap-2 text-center'>
          <LockKeyhole className='size-8 text-emerald-600 dark:text-emerald-400' />
          <h1 className='text-2xl font-bold'>Keystead</h1>
          <p className='text-sm text-zinc-500 dark:text-zinc-400'>{subtitle}</p>
        </div>
        {children}
      </div>
    </main>
  );
}
