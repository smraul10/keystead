import { useEffect, useState } from 'react';
import { copyToClipboard } from '@/api';
import { useClipboardStore } from './clipboardStore';

export function useCopyToClipboard(resetAfterMs = 2000) {
  // How the last copy went, shown for a moment
  const [result, setResult] = useState<'copied' | 'failed' | null>(null);
  const startCountdown = useClipboardStore((state) => state.startCountdown);

  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(() => setResult(null), resetAfterMs);
    return () => clearTimeout(timer);
  }, [result, resetAfterMs]);

  // Rust copies it: out of the Windows clipboard history, and wiped later.
  // The status bar counts down the seconds Rust gives
  async function copy(text: string) {
    try {
      const seconds = await copyToClipboard(text);
      setResult('copied');
      startCountdown(seconds);
    } catch {
      setResult('failed');
    }
  }

  return {
    copied: result === 'copied',
    failed: result === 'failed',
    copy,
    reset: () => setResult(null),
  };
}
