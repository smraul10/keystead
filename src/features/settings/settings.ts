import { z } from 'zod';

// The choices Settings offers. No "Never": the vault always locks in the
// end, and a copy is always wiped
export const AUTO_LOCK_MINUTES = [1, 5, 10, 15, 30, 60] as const;
export const CLIPBOARD_SECONDS = [10, 30, 60, 90] as const;
// "system" follows Windows' light or dark mode. The twin of `ThemeSetting`
// in src-tauri/src/theme.rs: keep both in sync
export const THEMES = ['light', 'dark', 'system'] as const;

// Each setting falls back to its default on its own, so one damaged value
// doesn't lose the others. 10 minutes like 1Password; 30 seconds between
// KeePassXC's 10 and 1Password's 90
export const autoLockMinutesSchema = z.literal(AUTO_LOCK_MINUTES).catch(10);
export const clipboardSecondsSchema = z.literal(CLIPBOARD_SECONDS).catch(30);
// Like 1Password, Bitwarden and KeePassXC: Windows' mode by default
export const themeSchema = z.enum(THEMES).catch('system');

const settingsSchema = z.object({
  autoLockMinutes: autoLockMinutesSchema,
  clipboardSeconds: clipboardSecondsSchema,
  theme: themeSchema,
});

export type Settings = z.infer<typeof settingsSchema>;
export type Theme = Settings['theme'];

/** The settings read from storage, which is data from outside: always valid. */
export function parseSettings(value: unknown): Settings {
  // Not even an object: every setting gets its default
  return settingsSchema.parse(typeof value === 'object' && value ? value : {});
}

// The defaults come from the schema itself, so they are written only once
export const DEFAULT_SETTINGS: Settings = parseSettings({});
