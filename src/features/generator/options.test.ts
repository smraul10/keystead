import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PASSWORD_OPTIONS,
  isValidLength,
  sanitizeOptions,
} from './options';

describe('isValidLength', () => {
  it.each([
    [8, true],
    [20, true],
    [128, true],
    [7, false],
    [129, false],
    [12.5, false],
    [NaN, false],
  ])('returns for %s: %s', (length, expected) => {
    // Act + Assert
    expect(isValidLength(length)).toBe(expected);
  });
});

describe('sanitizeOptions', () => {
  it('keeps valid options', () => {
    // Arrange
    const stored = { ...DEFAULT_PASSWORD_OPTIONS, length: 32, symbols: false };

    // Act + Assert
    expect(sanitizeOptions(stored)).toEqual(stored);
  });

  it.each([null, 'hello', 42])('returns the defaults for %s', (stored) => {
    // Act + Assert
    expect(sanitizeOptions(stored)).toEqual(DEFAULT_PASSWORD_OPTIONS);
  });

  it('replaces invalid fields with the defaults', () => {
    // Arrange: out-of-range length and a text instead of a boolean
    const stored = { ...DEFAULT_PASSWORD_OPTIONS, length: 5, digits: 'yes' };

    // Act + Assert
    expect(sanitizeOptions(stored)).toEqual(DEFAULT_PASSWORD_OPTIONS);
  });

  it('fills missing fields with the defaults', () => {
    // Arrange: saved by an older version that only knew the length
    const stored = { length: 32 };

    // Act + Assert
    expect(sanitizeOptions(stored)).toEqual({
      ...DEFAULT_PASSWORD_OPTIONS,
      length: 32,
    });
  });

  it('returns the defaults when no character type is enabled', () => {
    // Arrange
    const stored = {
      ...DEFAULT_PASSWORD_OPTIONS,
      lowercase: false,
      uppercase: false,
      digits: false,
      symbols: false,
    };

    // Act + Assert
    expect(sanitizeOptions(stored)).toEqual(DEFAULT_PASSWORD_OPTIONS);
  });
});
