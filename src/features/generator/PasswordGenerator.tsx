import { useState } from 'react';
import { Checkbox } from '../../components/Checkbox';
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
      <fieldset>
        <legend>Character types</legend>
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

      <fieldset>
        <legend>Rules</legend>
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
