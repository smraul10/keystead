import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from './settings';
import { loadSettings, useSettingsStore } from './settingsStore';

describe('settingsStore', () => {
  // The store lives outside React and survives between tests: reset it
  beforeEach(() => {
    useSettingsStore.setState(DEFAULT_SETTINGS);
  });

  it('saves every change at once', () => {
    useSettingsStore.getState().update({ autoLockMinutes: 5 });

    expect(useSettingsStore.getState().autoLockMinutes).toBe(5);
    expect(JSON.parse(localStorage.getItem('settings') ?? 'null')).toEqual({
      autoLockMinutes: 5,
      clipboardSeconds: 30,
    });
  });

  it('reads the saved settings', () => {
    const saved = { autoLockMinutes: 15, clipboardSeconds: 10 };
    localStorage.setItem('settings', JSON.stringify(saved));

    expect(loadSettings()).toEqual(saved);
  });

  it('uses the defaults if what was saved is damaged', () => {
    localStorage.setItem('settings', '{not json');

    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});
