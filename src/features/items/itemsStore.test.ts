import { mockIPC } from '@tauri-apps/api/mocks';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ItemFormValues } from './itemSchema';
import { useItemsStore } from './itemsStore';
import { makeItem } from './makeItem';

const NEW_ITEM: ItemFormValues = {
  title: 'Netflix',
  username: 'raul@example.com',
  password: 'B2+vk8})GFe^?g14}@',
  url: 'https://www.netflix.com',
  notes: '',
  favorite: false,
};

describe('itemsStore', () => {
  // The store lives outside React and survives between tests: reset it
  beforeEach(() => {
    useItemsStore.setState({
      items: [
        makeItem({ id: '1', title: 'GitHub' }),
        makeItem({ id: '2', title: 'Gmail', favorite: true }),
      ],
      saveError: null,
    });
    // Rust accepts every save, unless a test says otherwise
    mockIPC(() => null);
  });

  afterEach(async () => {
    // Let the saves of this test end before the next one starts
    await useItemsStore.getState().waitForSaves();
    vi.useRealTimers();
  });

  it('starts empty, until a vault is unlocked', () => {
    expect(useItemsStore.getInitialState().items).toEqual([]);
  });

  it('loads the items of the unlocked vault', () => {
    const items = [makeItem({ id: '3', title: 'Netflix' })];

    useItemsStore.getState().loadItems(items);

    expect(useItemsStore.getState().items).toEqual(items);
  });

  it('forgets every item', () => {
    useItemsStore.getState().clearItems();

    expect(useItemsStore.getState().items).toEqual([]);
  });

  it('saves every change in the vault', async () => {
    // Arrange: remember what Rust receives
    const saved: unknown[] = [];
    mockIPC((command, args) => {
      if (command === 'save_vault') {
        saved.push(args);
      }
      return null;
    });

    // Act
    useItemsStore.getState().toggleFavorite('1');
    await useItemsStore.getState().waitForSaves();

    // Assert: Rust got the list as it is now
    expect(saved).toEqual([{ items: useItemsStore.getState().items }]);
  });

  it('does not save when loading or forgetting the items', async () => {
    // Arrange
    const commands: string[] = [];
    mockIPC((command) => {
      commands.push(command);
      return null;
    });

    // Act
    useItemsStore
      .getState()
      .loadItems([makeItem({ id: '3', title: 'Netflix' })]);
    useItemsStore.getState().clearItems();
    await useItemsStore.getState().waitForSaves();

    // Assert: saving the empty list would empty the vault on disk
    expect(commands).toEqual([]);
  });

  it('remembers why saving failed, until a save works', async () => {
    // Arrange: the disk fails
    mockIPC(() => Promise.reject({ kind: 'storage' }));
    useItemsStore.getState().toggleFavorite('1');
    await useItemsStore.getState().waitForSaves();
    expect(useItemsStore.getState().saveError).toEqual({ kind: 'storage' });

    // Act: the disk works again
    mockIPC(() => null);
    useItemsStore.getState().retrySave();
    await useItemsStore.getState().waitForSaves();

    // Assert
    expect(useItemsStore.getState().saveError).toBeNull();
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

  it('adds a new item with the current date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-22T10:00:00.000Z'));

    const id = useItemsStore.getState().addItem(NEW_ITEM);

    const items = useItemsStore.getState().items;
    expect(items).toHaveLength(3);
    expect(items.find((item) => item.id === id)).toEqual({
      ...NEW_ITEM,
      id,
      createdAt: '2026-10-22T10:00:00.000Z',
      updatedAt: '2026-10-22T10:00:00.000Z',
      deletedAt: null,
    });
  });

  it('updates an item and its edit date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-22T10:00:00.000Z'));

    useItemsStore.getState().updateItem('1', NEW_ITEM);

    // id, creation date and trash state are kept; everything else changes
    expect(useItemsStore.getState().items[0]).toEqual({
      ...NEW_ITEM,
      id: '1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-10-22T10:00:00.000Z',
      deletedAt: null,
    });
  });

  it('leaves the other items untouched when updating one', () => {
    const gmail = useItemsStore.getState().items[1];

    useItemsStore.getState().updateItem('1', NEW_ITEM);

    expect(useItemsStore.getState().items[1]).toBe(gmail);
  });

  it('gives every new item a different id', () => {
    const first = useItemsStore.getState().addItem(NEW_ITEM);
    const second = useItemsStore.getState().addItem(NEW_ITEM);

    expect(first).not.toBe(second);
  });
});
