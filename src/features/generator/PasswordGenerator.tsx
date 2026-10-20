import { useEffect, useState } from 'react';
import { Checkbox } from '../../components/Checkbox';
import {
  DEFAULT_PASSWORD_OPTIONS,
  generatePassword,
  isValidLength,
  MAX_LENGTH,
  MIN_LENGTH,
  type PasswordOptions,
} from './generatePassword';
import { type CharType, getCharType } from './getCharType';
import { Button } from '../../components/Button';
import { getEntropy, getStrength, type Strength } from './strength';

const CHARACTER_TYPES = [
  { option: 'lowercase', label: 'Lowercase' },
  { option: 'uppercase', label: 'Uppercase' },
  { option: 'digits', label: 'Digits' },
  { option: 'symbols', label: 'Symbols' },
] as const;

const CHAR_TYPE_COLORS: Record<CharType, string> = {
  letter: '',
  digit: 'text-blue-600',
  symbol: 'text-rose-600',
};

const STRENGTH_STYLES: Record<
  Strength,
  { label: string; icon: string; className: string }
> = {
  poor: {
    label: 'Poor',
    icon: '✕',
    className: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  },
  weak: {
    label: 'Weak',
    icon: '!',
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  },
  good: {
    label: 'Good',
    icon: '✓',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  excellent: {
    label: 'Excellent',
    icon: '✓✓',
    className: 'bg-emerald-100 text-emerald-800 ring-emerald-600/30',
  },
};

const RULES = [
  { option: 'excludeAmbiguous', label: 'Avoid ambiguous characters' },
  { option: 'requireEachType', label: 'Include every selected type' },
] as const;

export function PasswordGenerator() {
  const [options, setOptions] = useState<PasswordOptions>(
    DEFAULT_PASSWORD_OPTIONS,
  );

  const [password, setPassword] = useState(() =>
    generatePassword(DEFAULT_PASSWORD_OPTIONS),
  );

  const [copied, setCopied] = useState(false);

  const [lengthDraft, setLengthDraft] = useState<string | null>(null);

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
    setOptions(next);
    setPassword(generatePassword(next));
    setCopied(false);
  }

  function regenerate() {
    setPassword(generatePassword(options));
    setCopied(false);
  }

  async function copyPassword() {
    await navigator.clipboard.writeText(password);
    setCopied(true);
  }

  const enabledTypes = CHARACTER_TYPES.filter(
    ({ option }) => options[option],
  ).length;

  const bits = getEntropy(options);
  const strength = getStrength(bits);

  return (
    <div className='flex w-full max-w-md flex-col gap-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm'>
      <div className='flex flex-col gap-2'>
        <div className='flex items-center justify-between'>
          <span className='text-xs font-semibold tracking-wide text-zinc-500 uppercase'>
            Password
          </span>
          <p
            title={`${Math.round(bits)} bits of entropy`}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STRENGTH_STYLES[strength].className}`}
          >
            <span className='sr-only'>Password strength:</span>
            <span aria-hidden='true'>{STRENGTH_STYLES[strength].icon}</span>
            <span>{STRENGTH_STYLES[strength].label}</span>
          </p>
        </div>

        <output
          aria-label='Generated password'
          className='rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 font-mono text-lg tracking-wider break-all'
        >
          {password.split('').map((char, index) => (
            <span key={index} className={CHAR_TYPE_COLORS[getCharType(char)]}>
              {char}
            </span>
          ))}
        </output>

        <div className='grid grid-cols-2 gap-2'>
          <Button onClick={regenerate}>
            <span aria-hidden='true'>↻</span> Regenerate
          </Button>
          <Button onClick={copyPassword}>
            <span aria-hidden='true'>{copied ? '✓' : '⧉'}</span>{' '}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>

      <div className='flex items-center gap-3'>
        <label className='flex flex-1 items-center gap-3'>
          Length
          <input
            type='range'
            min={MIN_LENGTH}
            max={MAX_LENGTH}
            value={options.length}
            onChange={(event) =>
              updateOptions({ ...options, length: Number(event.target.value) })
            }
            className='flex-1 accent-emerald-600'
          />
        </label>
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

      <fieldset className='grid grid-cols-2 gap-2'>
        <legend className='mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase'>
          Character types
        </legend>
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
        <legend className='mb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase'>
          Rules
        </legend>
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
  );
}
