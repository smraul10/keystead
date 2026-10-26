import { type ReactNode, useId } from 'react';
import {
  AUTO_LOCK_MINUTES,
  autoLockMinutesSchema,
  CLIPBOARD_SECONDS,
  clipboardSecondsSchema,
  type Theme,
  THEMES,
  themeSchema,
} from './settings';
import { useSettingsStore } from './settingsStore';

const CARD =
  'flex max-w-xl flex-col gap-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900';
const CARD_TITLE =
  'text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400';
const SELECT =
  'shrink-0 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900';

const THEME_LABELS: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

function minutesLabel(minutes: number): string {
  if (minutes === 60) return '1 hour';
  if (minutes === 1) return '1 minute';
  return `${minutes} minutes`;
}

interface SettingProps {
  id: string;
  label: string;
  description: string;
  children: ReactNode;
}

// A setting: its name and what it does on the left, its control on the right
function Setting({ id, label, description, children }: SettingProps) {
  return (
    <div className='flex items-center justify-between gap-6'>
      <div className='flex flex-col gap-0.5'>
        <label
          htmlFor={id}
          className='text-sm font-medium text-zinc-900 dark:text-zinc-100'
        >
          {label}
        </label>
        <p
          id={`${id}-description`}
          className='text-sm text-zinc-500 dark:text-zinc-400'
        >
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}

// Every change applies and is saved at once: there is no Save button
export function SettingsView() {
  const id = useId();
  const autoLockMinutes = useSettingsStore((state) => state.autoLockMinutes);
  const clipboardSeconds = useSettingsStore((state) => state.clipboardSeconds);
  const theme = useSettingsStore((state) => state.theme);
  const update = useSettingsStore((state) => state.update);

  return (
    <div className='flex flex-col gap-6 p-8'>
      <h1 className='text-2xl font-bold'>Settings</h1>

      <section aria-labelledby={`${id}-security`} className={CARD}>
        <h2 id={`${id}-security`} className={CARD_TITLE}>
          Security
        </h2>

        <Setting
          id={`${id}-auto-lock`}
          label='Lock after inactivity'
          description='The vault locks after this long without using Keystead.'
        >
          <select
            id={`${id}-auto-lock`}
            aria-describedby={`${id}-auto-lock-description`}
            value={autoLockMinutes}
            // The value of an <option> is text: read it back with the schema
            onChange={(event) =>
              update({
                autoLockMinutes: autoLockMinutesSchema.parse(
                  Number(event.target.value),
                ),
              })
            }
            className={SELECT}
          >
            {AUTO_LOCK_MINUTES.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutesLabel(minutes)}
              </option>
            ))}
          </select>
        </Setting>

        <Setting
          id={`${id}-clipboard`}
          label='Clear clipboard after'
          description='What you copy from Keystead is wiped from the clipboard after this long.'
        >
          <select
            id={`${id}-clipboard`}
            aria-describedby={`${id}-clipboard-description`}
            value={clipboardSeconds}
            onChange={(event) =>
              update({
                clipboardSeconds: clipboardSecondsSchema.parse(
                  Number(event.target.value),
                ),
              })
            }
            className={SELECT}
          >
            {CLIPBOARD_SECONDS.map((seconds) => (
              <option key={seconds} value={seconds}>
                {seconds} seconds
              </option>
            ))}
          </select>
        </Setting>
      </section>

      <section aria-labelledby={`${id}-appearance`} className={CARD}>
        <h2 id={`${id}-appearance`} className={CARD_TITLE}>
          Appearance
        </h2>

        <Setting
          id={`${id}-theme`}
          label='Theme'
          description='"System" follows the light or dark mode of Windows.'
        >
          <select
            id={`${id}-theme`}
            aria-describedby={`${id}-theme-description`}
            value={theme}
            onChange={(event) =>
              update({ theme: themeSchema.parse(event.target.value) })
            }
            className={SELECT}
          >
            {THEMES.map((option) => (
              <option key={option} value={option}>
                {THEME_LABELS[option]}
              </option>
            ))}
          </select>
        </Setting>
      </section>
    </div>
  );
}
