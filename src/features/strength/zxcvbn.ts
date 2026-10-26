import { ZxcvbnFactory } from '@zxcvbn-ts/core';
import * as common from '@zxcvbn-ts/language-common';
import * as english from '@zxcvbn-ts/language-en';
import * as spanish from '@zxcvbn-ts/language-es-es';

// Common passwords and keyboard layouts, plus English and Spanish words,
// names and places (each dictionary has its own name: none hides another)
const zxcvbn = new ZxcvbnFactory({
  graphs: common.adjacencyGraphs,
  dictionary: {
    ...common.dictionary,
    ...english.dictionary,
    ...spanish.dictionary,
  },
});

// Passphrases are split into words at spaces and common separators
const SEPARATORS = /[\s\-_.]+/;

/**
 * Estimates how strong a typed password is, in bits. Each word is measured
 * by zxcvbn, which knows common passwords, words, names, dates and keyboard
 * patterns. The parts where it finds no pattern count as random characters,
 * as the generator counts them: zxcvbn alone counts only 10 options for each
 * one, and a generated password would look much weaker than the generator says.
 */
export function estimateBits(password: string): number {
  return password
    .split(SEPARATORS)
    .filter((word) => word !== '')
    .reduce((bits, word) => bits + wordBits(word), 0);
}

function wordBits(word: string): number {
  return zxcvbn
    .check(word)
    .sequence.reduce(
      (bits, match) =>
        bits +
        (match.pattern === 'bruteforce'
          ? randomBits(match.token)
          : Math.log2(match.guesses)),
      0,
    );
}

// Random characters: each one could be any of the kinds it has
function randomBits(text: string): number {
  return text.length * Math.log2(alphabetSize(text));
}

function alphabetSize(text: string): number {
  let size = 0;
  if (/[a-z]/.test(text)) size += 26;
  if (/[A-Z]/.test(text)) size += 26;
  if (/[0-9]/.test(text)) size += 10;
  // The other printable ASCII characters: symbols and the space
  if (/[ -/:-@[-`{-~]/.test(text)) size += 33;
  // Anything else: accents, ñ, emoji...
  if (/[^ -~]/.test(text)) size += 100;
  return size;
}
