import { useEffect, useId, useState } from 'react';
import { Checkbox } from '@/components/Checkbox';
import { generatePassword } from './generatePassword';
import {
  DEFAULT_PASSWORD_OPTIONS,
  isValidLength,
  MAX_LENGTH,
  MIN_LENGTH,
  type PasswordOptions,
  sanitizeOptions,
} from './options';
import { Button } from '@/components/Button';
import { getEntropy } from './strength';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { StrengthBadge } from './components/StrengthBadge';
import { PasswordDisplay } from './components/PasswordDisplay';

const CHARACTER_TYPES = [
  { option: 'lowercase', label: 'Lowercase' },
  { option: 'uppercase', label: 'Uppercase' },
  { option: 'digits', label: 'Digits' },
  { option: 'symbols', label: 'Symbols' },
] as const;

const SECTION_TITLE =
  'text-xs font-semibold tracking-wide text-zinc-500 uppercase';

const RULES = [
  { option: 'excludeAmbiguous', label: 'Avoid ambiguous characters' },
  { option: 'requireEachType', label: 'Include every selected type' },
] as const;

export function PasswordGenerator() {
  // Saved options can be anything (edited, corrupted, older version): validate them
  const [storedOptions, setStoredOptions] = useLocalStorage<unknown>(
    'generator.options',
    DEFAULT_PASSWORD_OPTIONS,
  );
  const options = sanitizeOptions(storedOptions);

  const [password, setPassword] = useState(() => generatePassword(options));

  const [copied, setCopied] = useState(false);

  const [lengthDraft, setLengthDraft] = useState<string | null>(null);

  const [panelOpen, setPanelOpen] = useLocalStorage(
    'generator.panelOpen',
    false,
  );

  const [turns, setTurns] = useState(0);

  const lengthId = useId();

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  function changeLength(value: string) {
    setLengthDraft(value);
    const length = Number(value);
    if (isValidLength(length)) {
      updateOptions({ ...options, length });
    }
  }

  function updateOptions(next: PasswordOptions) {
    setStoredOptions(next);
    setPassword(generatePassword(next));
    setCopied(false);
  }

  function regenerate() {
    setPassword(generatePassword(options));
    setCopied(false);
    setTurns((current) => current + 1);
  }

  async function copyPassword() {
    await navigator.clipboard.writeText(password);
    setCopied(true);
  }

  const enabledTypes = CHARACTER_TYPES.filter(
    ({ option }) => options[option],
  ).length;

  const bits = getEntropy(options);

  return (
    <div className='flex w-full max-w-md flex-col gap-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm'>
      <div className='flex flex-col gap-2'>
        <div className='flex items-center justify-between'>
          <span className={SECTION_TITLE}>Password</span>
          <StrengthBadge bits={bits} />
        </div>

        <PasswordDisplay password={password} />

        <div className='grid grid-cols-2 gap-2'>
          <Button onClick={regenerate}>
            <span
              aria-hidden='true'
              className='inline-block transition-transform duration-500 motion-reduce:transition-none'
              style={{ transform: `rotate(${turns}turn)` }}
            >
              ↻
            </span>{' '}
            Regenerate
          </Button>
          <Button onClick={copyPassword}>
            <span aria-hidden='true'>{copied ? '✓' : '⧉'}</span>{' '}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>

      <div className='flex flex-col gap-2'>
        <label htmlFor={lengthId} className={SECTION_TITLE}>
          Length
        </label>
        <div className='flex items-center gap-3'>
          <input
            id={lengthId}
            type='range'
            min={MIN_LENGTH}
            max={MAX_LENGTH}
            value={options.length}
            onChange={(event) =>
              updateOptions({ ...options, length: Number(event.target.value) })
            }
            className='flex-1 cursor-pointer accent-emerald-600'
          />
          <input
            type='number'
            aria-label='Length'
            min={MIN_LENGTH}
            max={MAX_LENGTH}
            value={lengthDraft ?? options.length}
            onChange={(event) => changeLength(event.target.value)}
            onBlur={() => setLengthDraft(null)}
            className='w-16 rounded-md border border-zinc-300 bg-zinc-50 px-2 py-1 text-right font-mono'
          />
        </div>
      </div>

      <details
        open={panelOpen}
        onToggle={(event) => setPanelOpen(event.currentTarget.open)}
        className='group border-t border-zinc-200 pt-4 [interpolate-size:allow-keywords] details-content:h-0 details-content:overflow-clip details-content:transition-[height,content-visibility] details-content:transition-discrete details-content:duration-300 open:details-content:h-auto motion-reduce:details-content:transition-none'
      >
        <summary className='flex cursor-pointer list-none items-center justify-between rounded-md text-sm font-medium text-zinc-700'>
          Options
          <span
            aria-hidden='true'
            className='text-zinc-500 transition-transform group-open:rotate-180'
          >
            ▾
          </span>
        </summary>

        <div className='flex flex-col gap-5 pt-4'>
          <fieldset className='grid grid-cols-2 gap-2'>
            <legend className={`mb-2 ${SECTION_TITLE}`}>Character types</legend>
            {CHARACTER_TYPES.map(({ option, label }) => (
              <Checkbox
                key={label}
                label={label}
                checked={options[option]}
                disabled={options[option] && enabledTypes === 1}
                onChange={(checked) =>
                  updateOptions({ ...options, [option]: checked })
                }
              />
            ))}
          </fieldset>

          <fieldset className='grid gap-2'>
            <legend className={`mb-2 ${SECTION_TITLE}`}>Rules</legend>
            {RULES.map(({ option, label }) => (
              <Checkbox
                key={label}
                label={label}
                checked={options[option]}
                onChange={(checked) =>
                  updateOptions({ ...options, [option]: checked })
                }
              />
            ))}
          </fieldset>
        </div>
      </details>
    </div>
  );
}
