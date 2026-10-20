import { describe, expect, it } from 'vitest';
import { generatePassword } from './generatePassword';
import { DEFAULT_PASSWORD_OPTIONS } from './options';

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

  it.each([8, 21, 128])('accepts a length of %i', (length) => {
    // Arrange: a length inside the allowed range
    const options = { ...DEFAULT_PASSWORD_OPTIONS, length };

    // Act
    const password = generatePassword(options);

    // Assert
    expect(password).toHaveLength(length);
  });

  it.each([12.5, NaN])(
    'throws when the length is not an integer: %s',
    (length) => {
      // Arrange: a length that is not a whole number
      const options = { ...DEFAULT_PASSWORD_OPTIONS, length };

      // Act + Assert
      expect(() => generatePassword(options)).toThrow(
        'Length must be an integer',
      );
    },
  );

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

  it('includes at least one character of each enabled type', () => {
    // Arrange: shortest password, every type enabled
    const options = { ...DEFAULT_PASSWORD_OPTIONS, length: 8 };

    // Act + Assert: repeat many times so the test can't pass by luck
    for (let i = 0; i < 100; i++) {
      const password = generatePassword(options);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[0-9]/);
      expect(password).toMatch(/[^a-zA-Z0-9]/);
    }
  });

  it('fills the whole length when requireEachType is disabled', () => {
    // Arrange: default options, without required types
    const options = { ...DEFAULT_PASSWORD_OPTIONS, requireEachType: false };

    // Act
    const password = generatePassword(options);

    // Assert
    expect(password).toHaveLength(20);
  });

  it('does not always put the required characters at the start', () => {
    // Arrange: shortest password, only lowercase and digits
    const options = {
      ...DEFAULT_PASSWORD_OPTIONS,
      length: 8,
      uppercase: false,
      symbols: false,
    };

    // Act
    let startsWithDigit = 0;

    for (let i = 0; i < 100; i++) {
      if (/^[0-9]/.test(generatePassword(options))) startsWithDigit++;
    }

    // Assert
    expect(startsWithDigit).toBeGreaterThan(0);
  });
});
