const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.?';

export const MIN_LENGTH = 8;
export const MAX_LENGTH = 128;

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

export function generatePassword(options: PasswordOptions): string {
  if (options.length < MIN_LENGTH || options.length > MAX_LENGTH) {
    throw new Error(`Length must be between ${MIN_LENGTH} and ${MAX_LENGTH}`);
  }

  let pool = '';
  if (options.lowercase) pool += LOWERCASE;
  if (options.uppercase) pool += UPPERCASE;
  if (options.digits) pool += DIGITS;
  if (options.symbols) pool += SYMBOLS;

  if (pool.length === 0) {
    throw new Error('At least one character type must be enabled');
  }

  let password = '';
  for (let i = 0; i < options.length; i++) {
    password += pool.charAt(randomIndex(pool.length));
  }

  return password;
}
