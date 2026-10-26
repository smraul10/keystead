import { describe, expect, it } from 'vitest';
import { getStrength } from './levels';

describe('getStrength', () => {
  it.each([
    [39.9, 'poor'],
    [40, 'weak'],
    [74.9, 'weak'],
    [75, 'good'],
    [99.9, 'good'],
    [100, 'excellent'],
  ])('returns for %s bits: %s', (bits, expected) => {
    // Act + Assert
    expect(getStrength(bits)).toBe(expected);
  });
});
