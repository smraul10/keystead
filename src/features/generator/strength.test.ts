import { describe, expect, it } from 'vitest';
import { DEFAULT_PASSWORD_OPTIONS } from './generatePassword';
import { getEntropy, getStrength } from './strength';

describe('getEntropy', () => {
  it('calculates the entropy of the default options', () => {
    // Act + Assert: 20 characters from a pool of 85 → 20 × log2(85)
    expect(getEntropy(DEFAULT_PASSWORD_OPTIONS)).toBeCloseTo(128.2, 1);
  });

  it('calculates the entropy of a digits-only password', () => {
    // Arrange: 8 characters from a pool of 10 → 8 × log2(10)
    const options = {
      ...DEFAULT_PASSWORD_OPTIONS,
      length: 8,
      lowercase: false,
      uppercase: false,
      symbols: false,
    };

    // Act + Assert
    expect(getEntropy(options)).toBeCloseTo(26.6, 1);
  });

  it('lowers the entropy when ambiguous characters are excluded', () => {
    // Arrange: digits without 0 and 1 → pool of 8 → 8 × log2(8) = 24
    const options = {
      ...DEFAULT_PASSWORD_OPTIONS,
      length: 8,
      lowercase: false,
      uppercase: false,
      symbols: false,
      excludeAmbiguous: true,
    };

    // Act + Assert
    expect(getEntropy(options)).toBe(24);
  });
});

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
