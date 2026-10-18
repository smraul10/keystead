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

  it('throws when no character type is enabled', () => {
    // Arrange: every character type disabled
    const options = {
      ...DEFAULT_PASSWORD_OPTIONS,
      lowercase: false,
      uppercase: false,
      digits: false,
      symbols: false,
    };

    // Act + Assert
    expect(() => generatePassword(options)).toThrow(
      'At least one character type must be enabled',
    );
  });

  it.each([7, 129])('throws when the length is %i', (length) => {
    // Arrange: a length outside the allowed range
    const options = { ...DEFAULT_PASSWORD_OPTIONS, length };

    // Act + Assert
    expect(() => generatePassword(options)).toThrow(
      'Length must be between 8 and 128',
    );
  });

  it.each([8, 128])('accepts a length of %i', (length) => {
    // Arrange: a length at the edge of the allowed range
    const options = { ...DEFAULT_PASSWORD_OPTIONS, length };

    // Act
    const password = generatePassword(options);

    // Assert
    expect(password).toHaveLength(length);
  });

  it('never uses ambiguous characters when excludeAmbiguous is enabled', () => {
    // Arrange: ambiguous characters excluded, longest password
    const options = {
      ...DEFAULT_PASSWORD_OPTIONS,
      excludeAmbiguous: true,
      length: 128,
    };

    // Act
    const password = generatePassword(options);

    // Assert
    expect(password).not.toMatch(/[0O1lI]/);
  });
});
