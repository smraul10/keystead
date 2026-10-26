import type { ComponentPropsWithoutRef, ReactElement } from 'react';

interface IconButtonProps extends Omit<
  ComponentPropsWithoutRef<'button'>,
  'className' | 'type' | 'aria-label' | 'children'
> {
  // Becomes the accessible name: an icon alone says nothing to a screen
  // reader, so a label is required
  label: string;
  children: ReactElement;
}

// A small button with only an icon (edit, copy, show password...)
export function IconButton({ label, ...props }: IconButtonProps) {
  return (
    <button
      type='button'
      aria-label={label}
      {...props}
      className='cursor-pointer rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
    />
  );
}
