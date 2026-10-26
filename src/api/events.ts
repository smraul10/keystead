import { listen } from '@tauri-apps/api/event';

// Sent by Rust when Windows locks the session or goes to sleep
// (`LOCK_REQUESTED` in src-tauri/src/lib.rs): keep both in sync
const LOCK_REQUESTED = 'lock-requested';

/**
 * Calls `onLock` every time Rust asks to lock. Resolves to the function that
 * stops listening.
 */
export function onLockRequested(onLock: () => void): Promise<() => void> {
  // The event carries nothing: no data from outside to check
  return listen(LOCK_REQUESTED, () => onLock());
}
