import { describe, expect, it } from 'vitest';
import type { Item } from './item';
import { sortItems } from './sortItems';

function makeItem(title: string): Item {
  return {
    id: title,
    title,
    username: '',
    password: '',
    url: '',
    notes: '',
    favorite: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('sortItems', () => {
  it('sorts items by title', () => {
    // Arrange
    const items = ['Netflix', 'Amazon', 'GitHub'].map(makeItem);

    // Act
    const sorted = sortItems(items);

    // Assert
    expect(sorted.map((item) => item.title)).toEqual([
      'Amazon',
      'GitHub',
      'Netflix',
    ]);
  });

  it('ignores letter case', () => {
    // Arrange
    const items = ['GitHub', 'amazon'].map(makeItem);

    // Act
    const sorted = sortItems(items);

    // Assert
    expect(sorted.map((item) => item.title)).toEqual(['amazon', 'GitHub']);
  });

  it('sorts accented letters with their base letter', () => {
    // Arrange
    const items = ['Zara', 'Éxito'].map(makeItem);

    // Act
    const sorted = sortItems(items);

    // Assert
    expect(sorted.map((item) => item.title)).toEqual(['Éxito', 'Zara']);
  });

  it('sorts numbers naturally', () => {
    // Arrange
    const items = ['Server 10', 'Server 2'].map(makeItem);

    // Act
    const sorted = sortItems(items);

    // Assert: "2" < "10" as numbers, even though "1" < "2" as text
    expect(sorted.map((item) => item.title)).toEqual(['Server 2', 'Server 10']);
  });

  it('does not modify the original list', () => {
    // Arrange
    const items = ['B', 'A'].map(makeItem);

    // Act
    sortItems(items);

    // Assert: the input keeps its order
    expect(items.map((item) => item.title)).toEqual(['B', 'A']);
  });
});
