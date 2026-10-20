import { getCharacterSets, type PasswordOptions } from './options';

export type Strength = 'poor' | 'weak' | 'good' | 'excellent';

export function getEntropy(options: PasswordOptions): number {
  const poolSize = getCharacterSets(options).join('').length;
  return options.length * Math.log2(poolSize);
}

export function getStrength(bits: number): Strength {
  if (bits < 40) return 'poor';
  if (bits < 75) return 'weak';
  if (bits < 100) return 'good';
  return 'excellent';
}
