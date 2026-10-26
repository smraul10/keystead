import { z } from 'zod';

// The actions with a keyboard shortcut. Moving through the list (↑ ↓) and
// cancelling a form (Esc) are conventions: they are fixed, not settings
export const SHORTCUT_ACTIONS = [
  'lock',
  'search',
  'newItem',
  'editItem',
  'copyUsername',
  'copyPassword',
  'moveToTrash',
] as const;

export type ShortcutAction = (typeof SHORTCUT_ACTIONS)[number];

// What each action does, for Settings and the tooltips
export const SHORTCUT_LABELS: Record<ShortcutAction, string> = {
  lock: 'Lock',
  search: 'Search',
  newItem: 'New item',
  editItem: 'Edit item',
  copyUsername: 'Copy username',
  copyPassword: 'Copy password',
  moveToTrash: 'Move to trash',
};

// Like KeePassXC. Written like aria-keyshortcuts: the modifiers, then the key
export const DEFAULT_SHORTCUTS: Record<ShortcutAction, string> = {
  lock: 'Control+L',
  search: 'Control+F',
  newItem: 'Control+N',
  editItem: 'Control+E',
  copyUsername: 'Control+B',
  copyPassword: 'Control+C',
  moveToTrash: 'Delete',
};

// Some modifiers, then one key (which is never a "+" or empty)
const shortcutSchema = z.string().regex(/^((Control|Alt|Shift|Meta)\+)*[^+]+$/);

// Each shortcut falls back to its default on its own, like the settings
export const shortcutsSchema = z
  .object({
    lock: shortcutSchema.catch(DEFAULT_SHORTCUTS.lock),
    search: shortcutSchema.catch(DEFAULT_SHORTCUTS.search),
    newItem: shortcutSchema.catch(DEFAULT_SHORTCUTS.newItem),
    editItem: shortcutSchema.catch(DEFAULT_SHORTCUTS.editItem),
    copyUsername: shortcutSchema.catch(DEFAULT_SHORTCUTS.copyUsername),
    copyPassword: shortcutSchema.catch(DEFAULT_SHORTCUTS.copyPassword),
    moveToTrash: shortcutSchema.catch(DEFAULT_SHORTCUTS.moveToTrash),
  })
  // Saved before shortcuts existed: all the defaults
  .catch(DEFAULT_SHORTCUTS);

const MODIFIER_KEYS = ['Control', 'Alt', 'Shift', 'Meta'];

/**
 * The shortcut a key press makes, written like the saved ones
 * ("Control+L"), or null while only a modifier is pressed.
 */
export function eventToShortcut(event: KeyboardEvent): string | null {
  if (MODIFIER_KEYS.includes(event.key)) {
    return null;
  }
  const modifiers = [
    event.ctrlKey && 'Control',
    event.altKey && 'Alt',
    event.shiftKey && 'Shift',
    event.metaKey && 'Meta',
  ].filter((modifier) => modifier !== false);
  // Letters always uppercase ("l" and "L" are the same key); the space has
  // a name, so it can be read
  const key =
    event.key === ' '
      ? 'Space'
      : event.key.length === 1
        ? event.key.toUpperCase()
        : event.key;
  return [...modifiers, key].join('+');
}

/** A shortcut as the keyboard shows it: "Control+L" → "Ctrl+L". */
export function formatShortcut(shortcut: string): string {
  return shortcut.replace('Control', 'Ctrl');
}

// Inputs where nothing is typed: shortcuts keep working on them
const NOT_TYPED = ['checkbox', 'radio', 'range', 'button', 'submit', 'reset'];

/**
 * Whether the focus is somewhere text is typed: there, keys like Delete or
 * Ctrl+C keep their usual meaning.
 */
export function isTyping(target: EventTarget | null): boolean {
  if (target instanceof HTMLInputElement) {
    return !NOT_TYPED.includes(target.type);
  }
  return (
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    // `=== true`: jsdom, where the tests run, doesn't implement it
    (target instanceof HTMLElement && target.isContentEditable === true)
  );
}
