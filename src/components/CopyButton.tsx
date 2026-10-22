import { Check, Copy } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { IconButton } from './IconButton';

interface CopyButtonProps {
  text: string;
  label: string;
}

export function CopyButton({ text, label }: CopyButtonProps) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <IconButton label={copied ? 'Copied' : label} onClick={() => copy(text)}>
      {copied ? (
        <Check className='size-4 text-emerald-600' />
      ) : (
        <Copy className='size-4' />
      )}
    </IconButton>
  );
}
