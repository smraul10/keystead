import { create } from 'zustand';
import { FAKE_ITEMS } from './fakeItems';
import type { Item } from './item';
import type { ItemFormValues } from './itemSchema';

interface ItemsState {
  items: readonly Item[];
  toggleFavorite: (id: string) => void;
  moveToTrash: (id: string) => void;
  restore: (id: string) => void;
  deleteForever: (id: string) => void;
  addItem: (values: ItemFormValues) => string;
}

export const useItemsStore = create<ItemsState>()((set) => ({
  items: FAKE_ITEMS,
  toggleFavorite: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, favorite: !item.favorite } : item,
      ),
    })),
  moveToTrash: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id
          ? { ...item, deletedAt: new Date().toISOString() }
          : item,
      ),
    })),
  restore: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, deletedAt: null } : item,
      ),
    })),
  // Only items already in the trash can be deleted forever
  deleteForever: (id) =>
    set((state) => ({
      items: state.items.filter(
        (item) => !(item.id === id && item.deletedAt !== null),
      ),
    })),
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
    set((state) => ({ items: [...state.items, item] }));
    return item.id;
  },
}));
