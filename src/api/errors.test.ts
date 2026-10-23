import { describe, expect, it } from 'vitest';
import { errorMessage, toCommandError } from './errors';

describe('toCommandError', () => {
  it('keeps an error sent by Rust', () => {
    expect(toCommandError({ kind: 'newerVersion', version: 2 })).toEqual({
      kind: 'newerVersion',
      version: 2,
    });
  });

  it('treats anything else as an internal error', () => {
    // A system error, a typo in Rust, a missing permission...
    for (const unknown of ['boom', { kind: 'nope' }, null, new Error('x')]) {
      expect(toCommandError(unknown)).toEqual({ kind: 'internal' });
    }
  });
});

describe('errorMessage', () => {
  it('explains a wrong master password', () => {
    expect(errorMessage({ kind: 'wrongPassword' })).toBe(
      'Wrong master password',
    );
  });

  it('says which format a newer vault uses', () => {
    expect(errorMessage({ kind: 'newerVersion', version: 2 })).toContain(
      'format 2',
    );
  });
});
