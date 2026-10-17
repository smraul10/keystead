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
});
