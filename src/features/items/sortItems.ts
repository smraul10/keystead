import type { Item } from './item';

const collator = new Intl.Collator(undefined, {
  sensitivity: 'base',
  numeric: true,
});

// Favorites first; within each group, by title
export function sortItems(items: readonly Item[]): Item[] {
  return [...items].sort(
    (a, b) =>
      Number(b.favorite) - Number(a.favorite) ||
      collator.compare(a.title, b.title),
  );
}
