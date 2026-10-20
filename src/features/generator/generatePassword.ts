import {
  MIN_LENGTH,
  MAX_LENGTH,
  getCharacterSets,
  type PasswordOptions,
} from './options';
import { randomIndex, shuffle } from './random';

export function generatePassword(options: PasswordOptions): string {
  if (!Number.isInteger(options.length)) {
    throw new Error('Length must be an integer');
  }

  if (options.length < MIN_LENGTH || options.length > MAX_LENGTH) {
    throw new Error(`Length must be between ${MIN_LENGTH} and ${MAX_LENGTH}`);
  }

  const sets = getCharacterSets(options);

  if (sets.length === 0) {
    throw new Error('At least one character type must be enabled');
  }

  const pool = sets.join('');

  let password = '';

  // 1. One random character from each enabled set
  if (options.requireEachType) {
    for (const set of sets) {
      password += set.charAt(randomIndex(set.length));
    }
  }

  // 2. Fill the rest with random characters from the whole pool
  while (password.length < options.length) {
    password += pool.charAt(randomIndex(pool.length));
  }

  return shuffle(password);
}
