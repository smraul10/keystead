import { beforeEach, describe, expect, it } from 'vitest';
import { useItemsStore } from './itemsStore';
import { makeItem } from './makeItem';

describe('itemsStore', () => {
  // The store lives outside React and survives between tests: reset it
  beforeEach(() => {
    useItemsStore.setState({
      items: [
        makeItem({ id: '1', title: 'GitHub' }),
        makeItem({ id: '2', title: 'Gmail', favorite: true }),
      ],
    });
  });

  it('marks an item as favorite', () => {
    useItemsStore.getState().toggleFavorite('1');

    expect(useItemsStore.getState().items[0]?.favorite).toBe(true);
  });

  it('unmarks a favorite', () => {
    useItemsStore.getState().toggleFavorite('2');

    expect(useItemsStore.getState().items[1]?.favorite).toBe(false);
  });

  it('leaves the other items untouched', () => {
    const gmail = useItemsStore.getState().items[1];

    useItemsStore.getState().toggleFavorite('1');

    // Same object, not a copy: React knows it did not change
    expect(useItemsStore.getState().items[1]).toBe(gmail);
  });

  it('never modifies the previous list', () => {
    const before = useItemsStore.getState().items;

    useItemsStore.getState().toggleFavorite('1');

    expect(before[0]?.favorite).toBe(false);
    expect(useItemsStore.getState().items).not.toBe(before);
  });
});
