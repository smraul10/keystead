import type { Item } from './item';

export type ItemFilter = 'all' | 'favorites' | 'trash';

// Trashed items only appear in the trash
export function itemsInView(
  items: readonly Item[],
  filter: ItemFilter,
): Item[] {
  switch (filter) {
    case 'all':
      return items.filter((item) => item.deletedAt === null);
    case 'favorites':
      return items.filter((item) => item.favorite && item.deletedAt === null);
    case 'trash':
      return items.filter((item) => item.deletedAt !== null);
  }
}
