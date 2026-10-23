import { create } from 'zustand';
import { type CommandError, commandErrorOf, saveVault } from '@/api';
import type { Item } from './item';
import type { ItemFormValues } from './itemSchema';
import { createSaveQueue } from './saveQueue';

interface ItemsState {
  items: readonly Item[];
  // Why the last save failed; null while every change is saved
  saveError: CommandError | null;
  // The items of the vault that was just unlocked
  loadItems: (items: readonly Item[]) => void;
  // On lock: no item stays in the webview
  clearItems: () => void;
  // Saves the items again, after a save failed
  retrySave: () => void;
  // Resolves once every change made so far is saved (or failed)
  waitForSaves: () => Promise<void>;
  toggleFavorite: (id: string) => void;
  moveToTrash: (id: string) => void;
  restore: (id: string) => void;
  deleteForever: (id: string) => void;
  addItem: (values: ItemFormValues) => string;
  updateItem: (id: string, values: ItemFormValues) => void;
}

export const useItemsStore = create<ItemsState>()((set, get) => {
  // Rust saves the whole list, one save at a time (see saveQueue.ts)
  const saves = createSaveQueue({
    save: saveVault,
    onSuccess: () => set({ saveError: null }),
    onFailure: (error) => set({ saveError: commandErrorOf(error) }),
  });

  // Every change to the items goes through here: shown at once, then saved.
  // Loading and clearing them don't: saving after clearItems would empty
  // the vault on disk
  function change(update: (items: readonly Item[]) => readonly Item[]) {
    const items = update(get().items);
    set({ items });
    saves.save(items);
  }

  return {
    // Empty until a vault is unlocked: its items come from Rust
    items: [],
    saveError: null,
    loadItems: (items) => set({ items, saveError: null }),
    clearItems: () => set({ items: [], saveError: null }),
    retrySave: () => saves.save(get().items),
    waitForSaves: () => saves.flush(),
    toggleFavorite: (id) =>
      change((items) =>
        items.map((item) =>
          item.id === id ? { ...item, favorite: !item.favorite } : item,
        ),
      ),
    moveToTrash: (id) =>
      change((items) =>
        items.map((item) =>
          item.id === id
            ? { ...item, deletedAt: new Date().toISOString() }
            : item,
        ),
      ),
    restore: (id) =>
      change((items) =>
        items.map((item) =>
          item.id === id ? { ...item, deletedAt: null } : item,
        ),
      ),
    // Only items already in the trash can be deleted forever
    deleteForever: (id) =>
      change((items) =>
        items.filter((item) => !(item.id === id && item.deletedAt !== null)),
      ),
    // Returns the new id, so the caller can select the item
    addItem: (values) => {
      const now = new Date().toISOString();
      const item: Item = {
        ...values,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      change((items) => [...items, item]);
      return item.id;
    },
    // Keeps the id, the creation date and the trash state
    updateItem: (id, values) =>
      change((items) =>
        items.map((item) =>
          item.id === id
            ? { ...item, ...values, updatedAt: new Date().toISOString() }
            : item,
        ),
      ),
  };
});
