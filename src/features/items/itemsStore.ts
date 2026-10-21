import { create } from 'zustand';
import { FAKE_ITEMS } from './fakeItems';
import type { Item } from './item';

interface ItemsState {
  items: readonly Item[];
  toggleFavorite: (id: string) => void;
}

export const useItemsStore = create<ItemsState>()((set) => ({
  items: FAKE_ITEMS,
  toggleFavorite: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, favorite: !item.favorite } : item,
      ),
    })),
}));
