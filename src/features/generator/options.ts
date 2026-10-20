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
