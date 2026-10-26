import { useEffect, useEffectEvent } from 'react';
import { onLockRequested } from '@/api';

/**
 * Calls `lock` when Rust asks to: Windows locked the session or is going to
 * sleep. Only while mounted, so only while the vault is open.
 */
export function useLockRequests(lock: () => void): void {
  const onRequest = useEffectEvent(lock);

  useEffect(() => {
    let stopListening: (() => void) | undefined;
    let mounted = true;

    onLockRequested(() => onRequest())
      .then((stop) => {
        // Unmounted while the listener was being set up: stop it at once
        if (mounted) {
          stopListening = stop;
        } else {
          stop();
        }
      })
      // Nothing else to do: the auto-lock still locks in the end
      .catch(() => undefined);

    return () => {
      mounted = false;
      stopListening?.();
    };
  }, []);
}
