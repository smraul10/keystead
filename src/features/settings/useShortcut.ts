import { useEffect, useEffectEvent } from 'react';
import { useSettingsStore } from './settingsStore';
import {
  eventToShortcut,
  formatShortcut,
  isTyping,
  SHORTCUT_LABELS,
  type ShortcutAction,
} from './shortcuts';

interface ShortcutOptions {
  // Off while the action has nothing to act on (e.g. no item is selected)
  enabled?: boolean;
  // Also while typing in a field (Lock, Search...). Otherwise the key keeps
  // its usual meaning there: Delete erases, Ctrl+C copies the selected text
  whileTyping?: boolean;
}

function hasSelectedText(): boolean {
  return (window.getSelection()?.toString() ?? '') !== '';
}

/** Runs `run` when the shortcut of `action` (saved in Settings) is pressed. */
export function useShortcut(
  action: ShortcutAction,
  run: () => void,
  { enabled = true, whileTyping = false }: ShortcutOptions = {},
): void {
  const shortcut = useSettingsStore((state) => state.shortcuts[action]);
  // Always the latest `run`, without listening again after every render
  const onShortcut = useEffectEvent(run);

  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(event: KeyboardEvent) {
      if (eventToShortcut(event) !== shortcut) return;
      if (!whileTyping && (isTyping(event.target) || hasSelectedText())) {
        return;
      }
      // Instead of what the key does otherwise (e.g. the webview's own find)
      event.preventDefault();
      onShortcut();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shortcut, enabled, whileTyping]);
}

export interface ShortcutHint {
  title: string;
  'aria-keyshortcuts': string;
}

/**
 * Props that tell a control's shortcut: a tooltip ("Lock (Ctrl+L)") and
 * aria-keyshortcuts, which screen readers announce.
 */
export function useShortcutHint(action: ShortcutAction): ShortcutHint {
  const shortcut = useSettingsStore((state) => state.shortcuts[action]);
  return {
    title: `${SHORTCUT_LABELS[action]} (${formatShortcut(shortcut)})`,
    'aria-keyshortcuts': shortcut,
  };
}
