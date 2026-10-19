import { useState } from 'react';
import { Checkbox } from '../../components/Checkbox';
import {
  DEFAULT_PASSWORD_OPTIONS,
  generatePassword,
  MAX_LENGTH,
  MIN_LENGTH,
  type PasswordOptions,
} from './generatePassword';
import { type CharType, getCharType } from './getCharType';

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

  function updateOptions(next: PasswordOptions) {
    setOptions(next);
    setPassword(generatePassword(next)); // live regeneration
  }

  const enabledTypes = CHARACTER_TYPES.filter(
    ({ option }) => options[option],
  ).length;

  return (
    <div className='flex w-full max-w-md flex-col gap-5 rounded-xl border border-zinc-200 bg-white shadow-sm p-6'>
      <div className='flex gap-2'>
        <output
          aria-label='Generated password'
          className='flex-1 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 font-mono text-lg break-all'
        >
          {password.split('').map((char, index) => (
            <span key={index} className={CHAR_TYPE_COLORS[getCharType(char)]}>
              {char}
            </span>
          ))}
        </output>
        <button
          type='button'
          aria-label='Regenerate password'
          title='Regenerate password'
          onClick={() => setPassword(generatePassword(options))}
          className='rounded-lg bg-zinc-100 hover:bg-zinc-200 px-3 text-lg focus-visible:outline-2 focus-visible:outline-emerald-600 cursor-pointer'
        >
          ↻
        </button>
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
        <span className='w-8 text-right font-mono'>{options.length}</span>
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
