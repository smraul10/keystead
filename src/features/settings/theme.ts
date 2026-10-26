import { useEffect } from 'react';
import { setWindowTheme } from '@/api';
import type { Theme } from './settings';
import { useSettingsStore } from './settingsStore';

// Whether Windows is in dark mode
const DARK_QUERY = '(prefers-color-scheme: dark)';

/** Whether the app is dark, for a theme and Windows' own mode. */
export function isDark(theme: Theme, windowsIsDark: boolean): boolean {
  return theme === 'dark' || (theme === 'system' && windowsIsDark);
}

/**
 * Paints the whole app light or dark: Tailwind's `dark:` classes follow the
 * `dark` class of <html>.
 */
export function applyTheme(theme: Theme): void {
  const dark = isDark(theme, window.matchMedia(DARK_QUERY).matches);
  const html = document.documentElement;
  html.classList.toggle('dark', dark);
  // What the browser draws itself too: scrollbars, a <select>'s options...
  html.style.colorScheme = dark ? 'dark' : 'light';
}

/**
 * Keeps the app in the theme chosen in Settings, and in Windows' mode while
 * that is "system", even when Windows changes it.
 */
export function useTheme(): void {
  const theme = useSettingsStore((state) => state.theme);

  useEffect(() => {
    applyTheme(theme);
    // The title bar is drawn by Windows: Rust paints it. Only cosmetic, so
    // a failure changes nothing else
    setWindowTheme(theme).catch(() => undefined);

    if (theme !== 'system') return;
    const windowsMode = window.matchMedia(DARK_QUERY);
    const follow = () => applyTheme(theme);
    windowsMode.addEventListener('change', follow);
    return () => windowsMode.removeEventListener('change', follow);
  }, [theme]);
}
