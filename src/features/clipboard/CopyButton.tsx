import { Check, Copy, X } from 'lucide-react';
import { IconButton } from '@/components/IconButton';
import { useCopyToClipboard } from './useCopyToClipboard';

interface CopyButtonProps {
  text: string;
  label: string;
}

export function CopyButton({ text, label }: CopyButtonProps) {
  const { copied, failed, copy } = useCopyToClipboard();

  if (copied) {
    return (
      <IconButton label='Copied' onClick={() => copy(text)}>
        <Check className='size-4 text-emerald-600' />
      </IconButton>
    );
  }
  if (failed) {
    return (
      <IconButton label="Couldn't copy" onClick={() => copy(text)}>
        <X className='size-4 text-rose-600' />
      </IconButton>
    );
  }
  return (
    <IconButton label={label} onClick={() => copy(text)}>
      <Copy className='size-4' />
    </IconButton>
  );
}
