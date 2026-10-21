import { create } from 'zustand';
import { FAKE_ITEMS } from './fakeItems';
import type { Item } from './item';

interface ItemsState {
  items: readonly Item[];
  toggleFavorite: (id: string) => void;
  moveToTrash: (id: string) => void;
  restore: (id: string) => void;
  deleteForever: (id: string) => void;
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
}));
