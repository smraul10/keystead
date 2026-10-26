import { mockIPC } from '@tauri-apps/api/mocks';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyTheme, isDark, useTheme } from './theme';
import { useSettingsStore } from './settingsStore';

// Windows' own light or dark mode, which the test can switch
function fakeWindowsMode(dark: boolean) {
  let listener: EventListenerOrEventListenerObject | null = null;
  const windowsMode: MediaQueryList = {
    // A getter: it answers the mode of the moment, not the first one
    get matches() {
      return dark;
    },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: (
      _type: string,
      callback: EventListenerOrEventListenerObject | null,
    ) => {
      listener = callback;
    },
    removeEventListener: () => {
      listener = null;
    },
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  };
  vi.spyOn(window, 'matchMedia').mockReturnValue(windowsMode);
  return {
    switchTo(nowDark: boolean) {
      dark = nowDark;
      if (typeof listener === 'function') {
        listener(new Event('change'));
      }
    },
  };
}

const html = document.documentElement;

describe('isDark', () => {
  it.each([
    ['light', false, false],
    ['light', true, false],
    ['dark', false, true],
    ['dark', true, true],
    ['system', false, false],
    ['system', true, true],
  ] as const)(
    'theme %s with Windows dark %s: dark %s',
    (theme, windows, dark) => {
      expect(isDark(theme, windows)).toBe(dark);
    },
  );
});

describe('applyTheme', () => {
  afterEach(() => {
    applyTheme('light');
  });

  it('paints the whole app dark', () => {
    applyTheme('dark');

    // Tailwind's dark: classes follow this class
    expect(html).toHaveClass('dark');
    // Scrollbars and the options of a <select> follow this
    expect(html.style.colorScheme).toBe('dark');
  });

  it('paints it light again', () => {
    applyTheme('dark');

    applyTheme('light');

    expect(html).not.toHaveClass('dark');
    expect(html.style.colorScheme).toBe('light');
  });
});

describe('useTheme', () => {
  beforeEach(() => {
    mockIPC(() => null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    applyTheme('light');
  });

  it('applies the theme chosen in Settings', () => {
    useSettingsStore.setState({ theme: 'dark' });

    renderHook(() => useTheme());

    expect(html).toHaveClass('dark');
  });

  it("follows Windows' mode when it changes", () => {
    // Arrange: "system", with Windows in light mode
    const windows = fakeWindowsMode(false);
    useSettingsStore.setState({ theme: 'system' });
    renderHook(() => useTheme());
    expect(html).not.toHaveClass('dark');

    // Act
    act(() => {
      windows.switchTo(true);
    });

    // Assert
    expect(html).toHaveClass('dark');
  });

  it('asks Rust to paint the title bar too', () => {
    const received: unknown[] = [];
    mockIPC((command, args) => {
      if (command === 'set_window_theme') {
        received.push(args);
      }
      return null;
    });
    useSettingsStore.setState({ theme: 'dark' });

    renderHook(() => useTheme());

    expect(received).toEqual([{ theme: 'dark' }]);
  });
});
