import { create } from 'zustand';
// `api.createVault` reads as "ask Rust", next to the store's own createVault
import * as api from '@/api';

// Until the next PR: unlocking still opens the demo vault with a fixed
// master password, shown on the unlock screen. Then unlock() will ask Rust.
export const DEMO_MASTER_PASSWORD = 'keystead';

// What the app shows: Rust's VaultStatus, or 'checking' while waiting for
// it to say, at launch, whether there is a vault to create or to unlock
export type LockStatus = api.VaultStatus | 'checking';

interface LockState {
  status: LockStatus;
  // These ask Rust and throw a CommandFailedError if it fails
  checkStatus: () => Promise<void>;
  createVault: (masterPassword: string) => Promise<void>;
  // Async on purpose: in the next PR it will ask Rust, which takes a moment
  // (Argon2 is slow by design), and the unlock screen won't need to change
  unlock: (masterPassword: string) => Promise<boolean>;
  lock: () => Promise<void>;
}

export const useLockStore = create<LockState>()((set) => ({
  status: 'checking',
  checkStatus: async () => {
    set({ status: await api.getVaultStatus() });
  },
  // A new vault is left unlocked, like in other password managers
  createVault: async (masterPassword) => {
    await api.createVault(masterPassword);
    set({ status: 'unlocked' });
  },
  unlock: (masterPassword) => {
    const correct = masterPassword === DEMO_MASTER_PASSWORD;
    if (correct) {
      set({ status: 'unlocked' });
    }
    return Promise.resolve(correct);
  },
  lock: () => {
    // Hide the vault at once, without waiting for Rust to wipe it
    set({ status: 'locked' });
    return api.lockVault();
  },
}));
