import { describe, expect, it } from 'vitest';
import {
  checkShortcut,
  DEFAULT_SHORTCUTS,
  eventToShortcut,
  formatShortcut,
  isTyping,
  shortcutsSchema,
} from './shortcuts';

function keydown(key: string, modifiers: Partial<KeyboardEventInit> = {}) {
  return new KeyboardEvent('keydown', { key, ...modifiers });
}

describe('eventToShortcut', () => {
  it('writes the modifiers, then the key', () => {
    expect(eventToShortcut(keydown('l', { ctrlKey: true }))).toBe('Control+L');
    expect(
      eventToShortcut(keydown('k', { ctrlKey: true, shiftKey: true })),
    ).toBe('Control+Shift+K');
  });

  it('keeps the names of special keys', () => {
    expect(eventToShortcut(keydown('Delete'))).toBe('Delete');
    expect(eventToShortcut(keydown(' ', { altKey: true }))).toBe('Alt+Space');
  });

  it('names the plus key, which also joins the parts', () => {
    expect(eventToShortcut(keydown('+', { ctrlKey: true }))).toBe(
      'Control+Plus',
    );
  });

  it('ignores a modifier pressed alone', () => {
    expect(eventToShortcut(keydown('Control', { ctrlKey: true }))).toBeNull();
  });
});

describe('formatShortcut', () => {
  it('shows a shortcut as on the keyboard', () => {
    expect(formatShortcut('Control+Shift+K')).toBe('Ctrl+Shift+K');
    expect(formatShortcut('Delete')).toBe('Delete');
  });
});

describe('isTyping', () => {
  it('is true in a text field', () => {
    expect(isTyping(document.createElement('textarea'))).toBe(true);
    expect(isTyping(document.createElement('input'))).toBe(true);
  });

  it('is false on controls where nothing is typed', () => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';

    expect(isTyping(checkbox)).toBe(false);
    expect(isTyping(document.createElement('button'))).toBe(false);
    expect(isTyping(null)).toBe(false);
  });
});

describe('checkShortcut', () => {
  it('accepts a free shortcut', () => {
    expect(checkShortcut('lock', 'Control+K', DEFAULT_SHORTCUTS)).toBeNull();
  });

  it('accepts keeping the same shortcut', () => {
    expect(checkShortcut('lock', 'Control+L', DEFAULT_SHORTCUTS)).toBeNull();
  });

  it('refuses a shortcut that another action uses', () => {
    expect(checkShortcut('lock', 'Control+F', DEFAULT_SHORTCUTS)).toBe(
      'Already used by Search',
    );
  });

  it('refuses a key that would get in the way of typing', () => {
    for (const shortcut of ['K', 'Shift+K', 'Enter', 'Escape', 'ArrowDown']) {
      expect(checkShortcut('lock', shortcut, DEFAULT_SHORTCUTS)).toBe(
        'Add Ctrl or Alt: alone, that key would get in the way of typing',
      );
    }
  });

  it('accepts alone the keys that type nothing', () => {
    expect(checkShortcut('lock', 'F2', DEFAULT_SHORTCUTS)).toBeNull();
    expect(checkShortcut('lock', 'Insert', DEFAULT_SHORTCUTS)).toBeNull();
  });

  it('keeps the text editing keys for actions that work while typing', () => {
    // Locking works while typing: on Ctrl+V, it would never paste again
    expect(checkShortcut('lock', 'Control+V', DEFAULT_SHORTCUTS)).toBe(
      'Ctrl+V edits text, and Lock works while typing: choose another',
    );
    // Copying a password doesn't act in text fields: there, Ctrl+V pastes
    expect(
      checkShortcut('copyPassword', 'Control+V', DEFAULT_SHORTCUTS),
    ).toBeNull();
  });
});

describe('shortcutsSchema', () => {
  it('uses the defaults when nothing was saved', () => {
    expect(shortcutsSchema.parse(undefined)).toEqual(DEFAULT_SHORTCUTS);
  });

  it('replaces only the shortcuts that are not valid', () => {
    const saved = { ...DEFAULT_SHORTCUTS, lock: 'Control+K', search: 42 };

    expect(shortcutsSchema.parse(saved)).toEqual({
      ...DEFAULT_SHORTCUTS,
      lock: 'Control+K',
    });
  });
});
