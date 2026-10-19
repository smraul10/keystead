import { describe, expect, it } from 'vitest';
import { getCharType } from './getCharType';

describe('getCharType', () => {
  it.each([
    ['a', 'letter'],
    ['Z', 'letter'],
    ['l', 'letter'],
    ['O', 'letter'],
    ['7', 'digit'],
    ['0', 'digit'],
    ['1', 'digit'],
    ['#', 'symbol'],
    ['_', 'symbol'],
  ])('classifies %s as %s', (char, expected) => {
    // Act + Assert
    expect(getCharType(char)).toBe(expected);
  });
});
