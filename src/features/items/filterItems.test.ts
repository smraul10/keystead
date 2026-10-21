import { describe, expect, it } from 'vitest';
import { filterItems } from './filterItems';
import type { Item } from './item';
import { makeItem } from './makeItem';

const ITEMS = [
  makeItem({
    title: 'GitHub',
    username: 'raul-dev',
    url: 'https://github.com',
  }),
  makeItem({
    title: 'Gmail',
    username: 'raul@example.com',
    url: 'https://mail.google.com',
  }),
  makeItem({
    title: 'Éxito Online',
    username: 'raul.exito',
    password: 'github-is-not-here',
  }),
  makeItem({ title: 'Home Wi-Fi', notes: 'The router is in the living room.' }),
];

function titles(items: readonly Item[]): string[] {
  return items.map((item) => item.title);
}

describe('filterItems', () => {
  it('returns every item for an empty query', () => {
    expect(titles(filterItems(ITEMS, ''))).toEqual([
      'GitHub',
      'Gmail',
      'Éxito Online',
      'Home Wi-Fi',
    ]);
  });

  it('finds items by title', () => {
    expect(titles(filterItems(ITEMS, 'gmail'))).toEqual(['Gmail']);
  });

  it('ignores case and accents', () => {
    expect(titles(filterItems(ITEMS, 'EXITO'))).toEqual(['Éxito Online']);
  });

  it('finds items by username, website and notes', () => {
    expect(titles(filterItems(ITEMS, 'raul-dev'))).toEqual(['GitHub']);
    expect(titles(filterItems(ITEMS, 'mail.google'))).toEqual(['Gmail']);
    expect(titles(filterItems(ITEMS, 'living room'))).toEqual(['Home Wi-Fi']);
  });

  it('never searches in passwords', () => {
    expect(titles(filterItems(ITEMS, 'github'))).toEqual(['GitHub']);
  });

  it('requires every word to match', () => {
    expect(titles(filterItems(ITEMS, 'raul gmail'))).toEqual(['Gmail']);
  });

  it('ignores spaces around the query', () => {
    expect(titles(filterItems(ITEMS, '  gmail  '))).toEqual(['Gmail']);
  });
});
