import { describe, expect, it } from 'vitest';
import { AVATAR_COLORS, getAvatarColor, getInitial } from './avatar';

describe('getInitial', () => {
  it('returns the first letter in uppercase', () => {
    expect(getInitial('amazon')).toBe('A');
  });

  it('keeps accents', () => {
    expect(getInitial('éxito')).toBe('É');
  });

  it('ignores leading spaces', () => {
    expect(getInitial('  GitHub')).toBe('G');
  });

  it('keeps an emoji whole', () => {
    expect(getInitial('🔑 Keys')).toBe('🔑');
  });

  it('returns a question mark for an empty title', () => {
    expect(getInitial('')).toBe('?');
  });
});

describe('getAvatarColor', () => {
  it('always gives the same color to the same title', () => {
    expect(getAvatarColor('GitHub')).toBe(getAvatarColor('GitHub'));
  });

  it('ignores letter case', () => {
    expect(getAvatarColor('github')).toBe(getAvatarColor('GitHub'));
  });

  it('returns one of the avatar colors', () => {
    expect(AVATAR_COLORS).toContain(getAvatarColor('Netflix'));
  });

  it('spreads titles across several colors', () => {
    const titles = [
      'GitHub',
      'Gmail',
      'amazon',
      'Home Wi-Fi',
      'Netflix',
      'Spotify',
      'Steam',
      'PayPal',
    ];
    const colors = new Set(titles.map(getAvatarColor));
    expect(colors.size).toBeGreaterThan(3);
  });
});
