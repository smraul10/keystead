import { Check, Copy } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

interface CopyButtonProps {
  text: string;
  label: string;
}

export function CopyButton({ text, label }: CopyButtonProps) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <button
      type='button'
      aria-label={copied ? 'Copied' : label}
      onClick={() => copy(text)}
      className='cursor-pointer rounded-md p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900'
    >
      {copied ? (
        <Check className='size-4 text-emerald-600' />
      ) : (
        <Copy className='size-4' />
      )}
    </button>
  );
}
