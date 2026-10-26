import { getCharacterSets, type PasswordOptions } from './options';

// The entropy of a generated password: every character is random, so it
// depends only on the options (typed passwords use @/features/strength)
export function getEntropy(options: PasswordOptions): number {
  const poolSize = getCharacterSets(options).join('').length;
  return options.length * Math.log2(poolSize);
}
