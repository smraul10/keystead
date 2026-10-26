import { describe, expect, it } from 'vitest';
import { getStrength } from './levels';
import { estimateBits } from './zxcvbn';

function strengthOf(password: string) {
  return getStrength(estimateBits(password));
}

describe('estimateBits', () => {
  it('knows common passwords and their variations', () => {
    expect(strengthOf('password')).toBe('poor');
    expect(strengthOf('Password123!')).toBe('poor');
  });

  it('knows keyboard patterns', () => {
    expect(strengthOf('qwertyuiop12')).toBe('poor');
  });

  it('knows Spanish words and places', () => {
    expect(strengthOf('contraseña del perro')).toBe('poor');
    expect(strengthOf('Barcelona2026!')).toBe('poor');
  });

  it('measures random characters like the generator does', () => {
    // 20 characters, each one of 95 (letters, digits and symbols):
    // 20 × log2(95) ≈ 131 bits
    expect(estimateBits('b,YjHm4^9aBBNC[zP]GD')).toBeCloseTo(131.4, 0);
  });

  it('measures each word of a passphrase on its own', () => {
    // Four very common words: they must not count as random characters
    expect(strengthOf('correct horse battery staple')).toBe('poor');
  });

  it('measures long random passwords in full', () => {
    // 40 characters: zxcvbn checks the first 32 (it gets slow with long
    // words) and the rest count as random, so none is lost
    const password = 'tj7#Lq2v!Pz9wK*Rhm6k$Wqtj7#Lq2v!Pz9wK*Rh';

    expect(estimateBits(password)).toBeCloseTo(40 * Math.log2(95), 0);
  });

  it('gives no strength to an empty password', () => {
    expect(estimateBits('')).toBe(0);
  });
});
