import { type KeyboardEvent, useId, useState } from 'react';
import { Button } from '@/components/Button';
import { useSettingsStore } from '../settingsStore';
import {
  checkShortcut,
  DEFAULT_SHORTCUTS,
  eventToShortcut,
  formatShortcut,
  SHORTCUT_ACTIONS,
  SHORTCUT_LABELS,
  type ShortcutAction,
} from '../shortcuts';
import { CARD, CARD_TITLE, KEY } from '../styles';

const NAME = 'text-sm text-zinc-700 dark:text-zinc-300';

// Why the last keys pressed for an action can't be its shortcut
interface Problem {
  action: ShortcutAction;
  message: string;
}

// The shortcuts, each one a button: click it, then press the new keys
export function ShortcutsCard() {
  const id = useId();
  const shortcuts = useSettingsStore((state) => state.shortcuts);
  const update = useSettingsStore((state) => state.update);
  // The action whose new shortcut is being pressed, if any
  const [recording, setRecording] = useState<ShortcutAction | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);

  function stopRecording() {
    setRecording(null);
    setProblem(null);
  }

  function record(action: ShortcutAction, event: KeyboardEvent) {
    // Tab moves on, as always: never a trap for the keyboard (leaving the
    // button stops recording)
    if (event.key === 'Tab' && !event.ctrlKey && !event.altKey) return;
    // These keys are the new shortcut: nothing else may act on them (Ctrl+L
    // must not lock, Enter must not click the button again)
    event.preventDefault();
    event.stopPropagation();

    if (event.key === 'Escape') {
      stopRecording();
      return;
    }
    const shortcut = eventToShortcut(event.nativeEvent);
    // Only a modifier so far: wait for the key
    if (shortcut === null) return;

    const message = checkShortcut(action, shortcut, shortcuts);
    if (message !== null) {
      // Keep waiting: the user can try other keys
      setProblem({ action, message });
      return;
    }
    update({ shortcuts: { ...shortcuts, [action]: shortcut } });
    stopRecording();
  }

  return (
    <section aria-labelledby={`${id}-title`} className={CARD}>
      <div className='flex flex-col gap-1'>
        <h2 id={`${id}-title`} className={CARD_TITLE}>
          Keyboard shortcuts
        </h2>
        <p className='text-sm text-zinc-500 dark:text-zinc-400'>
          To change one, click it and press the new keys. Esc keeps it.
        </p>
      </div>

      <dl className='grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2'>
        {SHORTCUT_ACTIONS.map((action) => {
          const label = SHORTCUT_LABELS[action];
          const shortcut = formatShortcut(shortcuts[action]);
          const isRecording = recording === action;
          const problemId = `${id}-${action}-problem`;
          const hasProblem = problem?.action === action;

          return (
            <div key={action} className='contents'>
              <dt className={NAME}>{label}</dt>
              <dd className='flex flex-col items-end gap-1'>
                <Button
                  aria-label={
                    isRecording
                      ? `Press the new shortcut for ${label}`
                      : `Change the shortcut for ${label} (${shortcut})`
                  }
                  aria-describedby={hasProblem ? problemId : undefined}
                  onClick={() => {
                    setRecording(action);
                    setProblem(null);
                  }}
                  onKeyDown={
                    isRecording ? (event) => record(action, event) : undefined
                  }
                  onBlur={isRecording ? stopRecording : undefined}
                >
                  {isRecording ? (
                    'Press the new shortcut…'
                  ) : (
                    <kbd className={KEY}>{shortcut}</kbd>
                  )}
                </Button>
                {hasProblem && (
                  <p
                    id={problemId}
                    role='alert'
                    className='text-sm text-rose-700 dark:text-rose-400'
                  >
                    {problem.message}
                  </p>
                )}
              </dd>
            </div>
          );
        })}

        {/* Conventions, not settings */}
        <dt className={NAME}>Move through the list</dt>
        <dd className='text-right'>
          <kbd className={KEY}>↑</kbd> <kbd className={KEY}>↓</kbd>
        </dd>
        <dt className={NAME}>Cancel a form</dt>
        <dd className='text-right'>
          <kbd className={KEY}>Esc</kbd>
        </dd>
      </dl>

      {/* The wrapper keeps the button as wide as its text */}
      <div>
        <Button
          onClick={() => {
            update({ shortcuts: DEFAULT_SHORTCUTS });
            stopRecording();
          }}
        >
          Reset to defaults
        </Button>
      </div>
    </section>
  );
}
