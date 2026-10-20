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

function randomIndex(max: number): number {
  // Largest multiple of max that fits in a Uint32: values above it are unfair
  const range = 2 ** 32;
  const limit = range - (range % max);

  const values = new Uint32Array(1);
  do {
    crypto.getRandomValues(values);
  } while (values[0] >= limit); // re-roll while the value falls in the unfair zone

  return values[0] % max;
}

function removeAmbiguous(chars: string): string {
  return chars
    .split('')
    .filter((char) => !AMBIGUOUS.includes(char))
    .join('');
}

// Fisher-Yates shuffle with cryptographic randomness
function shuffle(chars: string): string {
  const array = chars.split('');
  for (let i = array.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1); // a random position between 0 and i (both included)
    [array[i], array[j]] = [array[j], array[i]]; // swap the two positions
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

  let sets: string[] = [];
  if (options.lowercase) sets.push(LOWERCASE);
  if (options.uppercase) sets.push(UPPERCASE);
  if (options.digits) sets.push(DIGITS);
  if (options.symbols) sets.push(SYMBOLS);

  if (options.excludeAmbiguous) {
    sets = sets.map(removeAmbiguous);
  }

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
