import { Check, Copy, X } from 'lucide-react';
import { IconButton } from '@/components/IconButton';
import type { ShortcutHint } from '@/features/settings';
import { useCopyToClipboard } from './useCopyToClipboard';

interface CopyButtonProps {
  text: string;
  label: string;
  // Its keyboard shortcut, told in a tooltip and to screen readers
  hint?: ShortcutHint;
}

export function CopyButton({ text, label, hint }: CopyButtonProps) {
  const { copied, failed, copy } = useCopyToClipboard();

  if (copied) {
    return (
      <IconButton label='Copied' onClick={() => copy(text)} {...hint}>
        <Check className='size-4 text-emerald-600 dark:text-emerald-400' />
      </IconButton>
    );
  }
  if (failed) {
    return (
      <IconButton label="Couldn't copy" onClick={() => copy(text)} {...hint}>
        <X className='size-4 text-rose-600 dark:text-rose-400' />
      </IconButton>
    );
  }
  return (
    <IconButton label={label} onClick={() => copy(text)} {...hint}>
      <Copy className='size-4' />
    </IconButton>
  );
}
