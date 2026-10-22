import { create } from 'zustand';

// Phase 2 only: a fixed master password for the demo vault, shown on the
// unlock screen. In phase 4, unlock() will ask Rust to open the real vault.
export const DEMO_MASTER_PASSWORD = 'keystead';

interface LockState {
  locked: boolean;
  // Async on purpose: in phase 4 it will ask Rust, which takes a moment
  // (Argon2 is slow by design), and the unlock screen won't need to change
  unlock: (masterPassword: string) => Promise<boolean>;
  lock: () => void;
}

export const useLockStore = create<LockState>()((set) => ({
  locked: true,
  unlock: (masterPassword) => {
    const correct = masterPassword === DEMO_MASTER_PASSWORD;
    if (correct) {
      set({ locked: false });
    }
    return Promise.resolve(correct);
  },
  lock: () => set({ locked: true }),
}));
