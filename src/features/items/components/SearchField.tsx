import { Search } from 'lucide-react';
import type { Ref } from 'react';
import type { ShortcutHint } from '@/features/settings';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  // React 19 passes `ref` as a prop: Ctrl+F focuses the field through it
  ref?: Ref<HTMLInputElement>;
  hint?: ShortcutHint;
}

export function SearchField({ value, onChange, ref, hint }: SearchFieldProps) {
  return (
    <div className='relative'>
      <Search className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500' />
      <input
        ref={ref}
        type='search'
        {...hint}
        aria-label='Search items'
        placeholder='Search'
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className='w-full rounded-md border border-zinc-300 bg-white py-1.5 pr-3 pl-8 text-sm placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-500'
      />
    </div>
  );
}
