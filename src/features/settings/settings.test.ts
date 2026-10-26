import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseSettings } from './settings';

describe('parseSettings', () => {
  it('uses the defaults when nothing valid was saved', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('damaged')).toEqual(DEFAULT_SETTINGS);
  });

  it('follows the system theme by default', () => {
    expect(DEFAULT_SETTINGS.theme).toBe('system');
  });

  it('keeps every valid setting', () => {
    const saved = { autoLockMinutes: 5, clipboardSeconds: 90, theme: 'dark' };

    expect(parseSettings(saved)).toEqual(saved);
  });

  it('replaces only the settings that are not valid', () => {
    // 7 minutes isn't one of the options: back to the default, 10
    const saved = { autoLockMinutes: 7, clipboardSeconds: 90, theme: 'pink' };

    expect(parseSettings(saved)).toEqual({
      autoLockMinutes: 10,
      clipboardSeconds: 90,
      theme: 'system',
    });
  });
});
