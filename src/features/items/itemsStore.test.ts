import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

  afterEach(() => {
    vi.useRealTimers();
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

  it('moves an item to the trash with the current date', () => {
    // Freeze the clock, so `new Date()` returns a known date
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-22T10:00:00.000Z'));

    useItemsStore.getState().moveToTrash('1');

    expect(useItemsStore.getState().items[0]?.deletedAt).toBe(
      '2026-10-22T10:00:00.000Z',
    );
  });

  it('restores an item from the trash', () => {
    useItemsStore.getState().moveToTrash('1');

    useItemsStore.getState().restore('1');

    expect(useItemsStore.getState().items[0]?.deletedAt).toBeNull();
  });

  it('deletes an item forever only from the trash', () => {
    // Not in the trash yet: nothing happens
    useItemsStore.getState().deleteForever('1');
    expect(useItemsStore.getState().items).toHaveLength(2);

    useItemsStore.getState().moveToTrash('1');
    useItemsStore.getState().deleteForever('1');

    expect(useItemsStore.getState().items.map((item) => item.id)).toEqual([
      '2',
    ]);
  });
});
