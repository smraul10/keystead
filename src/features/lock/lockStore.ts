import { create } from 'zustand';
// `api.createVault` reads as "ask Rust", next to the store's own createVault
import * as api from '@/api';
import { useItemsStore } from '@/features/items';

// What the app shows: Rust's VaultStatus, or 'checking' while waiting for
// it to say, at launch, whether there is a vault to create or to unlock
export type LockStatus = api.VaultStatus | 'checking';

interface LockState {
  status: LockStatus;
  // These ask Rust and throw a CommandFailedError if it fails
  checkStatus: () => Promise<void>;
  createVault: (masterPassword: string) => Promise<void>;
  unlock: (masterPassword: string) => Promise<void>;
  lock: () => Promise<void>;
}

export const useLockStore = create<LockState>()((set) => {
  // Every way into the vault ends here: load its items, then show them
  async function showVault() {
    useItemsStore.getState().loadItems(await api.getVaultItems());
    set({ status: 'unlocked' });
  }

  return {
    status: 'checking',
    checkStatus: async () => {
      const status = await api.getVaultStatus();
      if (status === 'unlocked') {
        // The window was reloaded while the vault was open in Rust
        await showVault();
      } else {
        set({ status });
      }
    },
    // A new vault is left unlocked, like in other password managers
    createVault: async (masterPassword) => {
      await api.createVault(masterPassword);
      await showVault();
    },
    unlock: async (masterPassword) => {
      await api.unlockVault(masterPassword);
      await showVault();
    },
    lock: async () => {
      // Hide the vault and forget its items at once, without waiting for Rust
      set({ status: 'locked' });
      const items = useItemsStore.getState();
      items.clearItems();
      // The last changes may still be on their way: let them reach the file
      // before Rust closes the vault
      await items.waitForSaves();
      await api.lockVault();
    },
  };
});
