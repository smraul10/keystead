import { useEffect, useState } from 'react';
import { copyToClipboard } from '@/api';

export function useCopyToClipboard(resetAfterMs = 2000) {
  // How the last copy went, shown for a moment
  const [result, setResult] = useState<'copied' | 'failed' | null>(null);

  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(() => setResult(null), resetAfterMs);
    return () => clearTimeout(timer);
  }, [result, resetAfterMs]);

  // Rust copies it: out of the Windows clipboard history, and wiped later
  async function copy(text: string) {
    try {
      await copyToClipboard(text);
      setResult('copied');
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
