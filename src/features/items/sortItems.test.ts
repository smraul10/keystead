import { describe, expect, it } from 'vitest';
import { sortItems } from './sortItems';
import { makeItem } from './makeItem';

describe('sortItems', () => {
  it('sorts items by title', () => {
    // Arrange
    const items = ['Netflix', 'Amazon', 'GitHub'].map((title) =>
      makeItem({ title }),
    );

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
    const items = ['GitHub', 'amazon'].map((title) => makeItem({ title }));

    // Act
    const sorted = sortItems(items);

    // Assert
    expect(sorted.map((item) => item.title)).toEqual(['amazon', 'GitHub']);
  });

  it('sorts accented letters with their base letter', () => {
    // Arrange
    const items = ['Zara', 'Éxito'].map((title) => makeItem({ title }));

    // Act
    const sorted = sortItems(items);

    // Assert
    expect(sorted.map((item) => item.title)).toEqual(['Éxito', 'Zara']);
  });

  it('sorts numbers naturally', () => {
    // Arrange
    const items = ['Server 10', 'Server 2'].map((title) => makeItem({ title }));

    // Act
    const sorted = sortItems(items);

    // Assert: "2" < "10" as numbers, even though "1" < "2" as text
    expect(sorted.map((item) => item.title)).toEqual(['Server 2', 'Server 10']);
  });

  it('puts favorites first', () => {
    // Arrange
    const items = [
      makeItem({ title: 'Amazon' }),
      makeItem({ title: 'Netflix', favorite: true }),
      makeItem({ title: 'GitHub', favorite: true }),
    ];

    // Act
    const sorted = sortItems(items);

    // Assert: favorites first, and each group still by title
    expect(sorted.map((item) => item.title)).toEqual([
      'GitHub',
      'Netflix',
      'Amazon',
    ]);
  });

  it('does not modify the original list', () => {
    // Arrange
    const items = ['B', 'A'].map((title) => makeItem({ title }));

    // Act
    sortItems(items);

    // Assert: the input keeps its order
    expect(items.map((item) => item.title)).toEqual(['B', 'A']);
  });
});
