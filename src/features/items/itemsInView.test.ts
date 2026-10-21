import { describe, expect, it } from 'vitest';
import type { Item } from './item';
import { itemsInView } from './itemsInView';
import { makeItem } from './makeItem';

const DELETED_AT = '2026-10-22T10:00:00.000Z';

const ITEMS = [
  makeItem({ title: 'GitHub', favorite: true }),
  makeItem({ title: 'Netflix' }),
  makeItem({ title: 'Old bank', favorite: true, deletedAt: DELETED_AT }),
  makeItem({ title: 'Old forum', deletedAt: DELETED_AT }),
];

function titles(items: readonly Item[]): string[] {
  return items.map((item) => item.title);
}

describe('itemsInView', () => {
  it('hides trashed items from all items', () => {
    expect(titles(itemsInView(ITEMS, 'all'))).toEqual(['GitHub', 'Netflix']);
  });

  it('hides trashed favorites from favorites', () => {
    expect(titles(itemsInView(ITEMS, 'favorites'))).toEqual(['GitHub']);
  });

  it('shows only trashed items in the trash', () => {
    expect(titles(itemsInView(ITEMS, 'trash'))).toEqual([
      'Old bank',
      'Old forum',
    ]);
  });
});
