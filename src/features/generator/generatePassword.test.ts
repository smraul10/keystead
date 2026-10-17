import { describe, expect, it } from 'vitest';
import { DEFAULT_PASSWORD_OPTIONS, generatePassword } from './generatePassword';

describe('generatePassword', () => {
  it('returns a password with the requested length', () => {
    // Arrange: default options, but with a custom length
    const options = { ...DEFAULT_PASSWORD_OPTIONS, length: 12 };

    // Act
    const password = generatePassword(options);

    // Assert
    expect(password).toHaveLength(12);
  });

  it('uses only digits when only digits are enabled', () => {
    // Arrange: only digits enabled
    const options = {
      ...DEFAULT_PASSWORD_OPTIONS,
      lowercase: false,
      uppercase: false,
      symbols: false,
    };

    // Act
    const password = generatePassword(options);

    // Assert
    expect(password).toMatch(/^[0-9]+$/);
  });

  it('generates a different password on each call', () => {
    // Arrange: default options
    const options = { ...DEFAULT_PASSWORD_OPTIONS };

    // Act
    const firstPassword = generatePassword(options);
    const secondPassword = generatePassword(options);

    // Assert
    expect(firstPassword).not.toBe(secondPassword);
  });
});
