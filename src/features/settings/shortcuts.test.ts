import { describe, expect, it } from 'vitest';
import {
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
