import { useEffect, useState } from 'react';
import { copyToClipboard } from '@/api';
import { useSettingsStore } from '@/features/settings';
import { useClipboardStore } from './clipboardStore';

export function useCopyToClipboard(resetAfterMs = 2000) {
  // How the last copy went, shown for a moment
  const [result, setResult] = useState<'copied' | 'failed' | null>(null);
  const startCountdown = useClipboardStore((state) => state.startCountdown);
  const clearAfterSeconds = useSettingsStore((state) => state.clipboardSeconds);

  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(() => setResult(null), resetAfterMs);
    return () => clearTimeout(timer);
  }, [result, resetAfterMs]);

  // Rust copies it: out of the Windows clipboard history, and wiped after
  // the time chosen in Settings. The status bar counts down what Rust says
  async function copy(text: string) {
    try {
      const seconds = await copyToClipboard(text, clearAfterSeconds);
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
