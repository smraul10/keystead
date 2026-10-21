import type { Item } from './item';

// Builds a complete item for tests: pass only the fields that matter
export function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: overrides.title ?? 'item',
    title: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    favorite: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}
