import type { Item } from './item';

const collator = new Intl.Collator(undefined, {
  sensitivity: 'base',
  numeric: true,
});

export function sortItems(items: readonly Item[]): Item[] {
  return [...items].sort((a, b) => collator.compare(a.title, b.title));
}
