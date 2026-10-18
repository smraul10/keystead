import { useState } from 'react';
import {
  DEFAULT_PASSWORD_OPTIONS,
  generatePassword,
  MAX_LENGTH,
  MIN_LENGTH,
  type PasswordOptions,
} from './generatePassword';

const CHARACTER_TYPES = [
  { option: 'lowercase', label: 'Lowercase' },
  { option: 'uppercase', label: 'Uppercase' },
  { option: 'digits', label: 'Digits' },
  { option: 'symbols', label: 'Symbols' },
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

  return (
    <div>
      <input readOnly aria-label='Generated password' value={password} />
      <button
        type='button'
        aria-label='Regenerate password'
        title='Regenerate password'
        onClick={() => setPassword(generatePassword(options))}
      >
        ↻
      </button>
      <label>
        Length
        <input
          type='range'
          min={MIN_LENGTH}
          max={MAX_LENGTH}
          value={options.length}
          onChange={(event) =>
            updateOptions({ ...options, length: Number(event.target.value) })
          }
        />
      </label>
      <span>{options.length}</span>
      {CHARACTER_TYPES.map(({ option, label }) => (
        <label key={label}>
          <input
            type='checkbox'
            checked={options[option]}
            onChange={(event) =>
              updateOptions({ ...options, [option]: event.target.checked })
            }
          />
          {label}
        </label>
      ))}
    </div>
  );
}
