import { create } from 'zustand';
import { parseSettings, type Settings } from './settings';

const STORAGE_KEY = 'settings';

/**
 * The settings saved on this computer, or the defaults. Preferences, not
 * secrets: they may live in localStorage, and they are read before unlocking.
 */
export function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return parseSettings(stored === null ? null : JSON.parse(stored));
  } catch {
    // Damaged, or the storage isn't available: the defaults
    return parseSettings(null);
  }
}

interface SettingsState extends Settings {
  // Changes are saved at once, like everything else in Keystead
  update: (changes: Partial<Settings>) => void;
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  ...loadSettings(),
  update: (changes) => {
    set(changes);
    // The schema keeps only the settings (not this function), checked
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parseSettings(get())));
  },
}));
