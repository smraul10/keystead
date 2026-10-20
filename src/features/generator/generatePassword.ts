const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.?';
const AMBIGUOUS = '0O1lI';

export const MIN_LENGTH = 8;
export const MAX_LENGTH = 128;

export function isValidLength(length: number): boolean {
  return (
    Number.isInteger(length) && length >= MIN_LENGTH && length <= MAX_LENGTH
  );
}

export interface PasswordOptions {
  length: number;
  lowercase: boolean;
  uppercase: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
  requireEachType: boolean;
}

export const DEFAULT_PASSWORD_OPTIONS: Readonly<PasswordOptions> = {
  length: 20,
  lowercase: true,
  uppercase: true,
  digits: true,
  symbols: true,
  excludeAmbiguous: false,
  requireEachType: true,
};

function randomUint32(): number {
  const [value] = crypto.getRandomValues(new Uint32Array(1));
  if (value === undefined) {
    throw new Error('Could not generate a random number');
  }
  return value;
}

function randomIndex(max: number): number {
  // Largest multiple of max that fits in a Uint32: values above it are unfair
  const range = 2 ** 32;
  const limit = range - (range % max);

  let value = randomUint32();
  while (value >= limit) {
    value = randomUint32(); // re-roll while the value falls in the unfair zone
  }
  return value % max;
}

function removeAmbiguous(chars: string): string {
  return chars
    .split('')
    .filter((char) => !AMBIGUOUS.includes(char))
    .join('');
}

export function getCharacterSets(options: PasswordOptions): string[] {
  let sets: string[] = [];
  if (options.lowercase) sets.push(LOWERCASE);
  if (options.uppercase) sets.push(UPPERCASE);
  if (options.digits) sets.push(DIGITS);
  if (options.symbols) sets.push(SYMBOLS);

  if (options.excludeAmbiguous) {
    sets = sets.map(removeAmbiguous);
  }

  return sets;
}

// Fisher-Yates shuffle with cryptographic randomness
function shuffle(chars: string): string {
  const array = chars.split('');
  for (let i = array.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1); // a random position between 0 and i (both included)
    const current = array[i];
    const other = array[j];
    if (current === undefined || other === undefined) {
      throw new Error('Shuffle index out of range'); // cannot happen: 0 <= j <= i < length
    }
    array[i] = other; // swap the two positions
    array[j] = current;
  }
  return array.join('');
}

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

function booleanOr(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function sanitizeOptions(value: unknown): PasswordOptions {
  // 1. Not an object (null, a text, a number...): nothing to keep
  if (typeof value !== 'object' || value === null) {
    return DEFAULT_PASSWORD_OPTIONS;
  }

  // 2. Keep each field only if it has the right type and a valid value
  const stored = value as Record<string, unknown>;
  const options: PasswordOptions = {
    length:
      typeof stored.length === 'number' && isValidLength(stored.length)
        ? stored.length
        : DEFAULT_PASSWORD_OPTIONS.length,
    lowercase: booleanOr(stored.lowercase, DEFAULT_PASSWORD_OPTIONS.lowercase),
    uppercase: booleanOr(stored.uppercase, DEFAULT_PASSWORD_OPTIONS.uppercase),
    digits: booleanOr(stored.digits, DEFAULT_PASSWORD_OPTIONS.digits),
    symbols: booleanOr(stored.symbols, DEFAULT_PASSWORD_OPTIONS.symbols),
    excludeAmbiguous: booleanOr(
      stored.excludeAmbiguous,
      DEFAULT_PASSWORD_OPTIONS.excludeAmbiguous,
    ),
    requireEachType: booleanOr(
      stored.requireEachType,
      DEFAULT_PASSWORD_OPTIONS.requireEachType,
    ),
  };

  // 3. Every character type disabled: the generator would throw
  if (getCharacterSets(options).length === 0) {
    return DEFAULT_PASSWORD_OPTIONS;
  }

  return options;
}
