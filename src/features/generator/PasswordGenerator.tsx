import { useEffect, useState } from 'react';
import { generatePassword } from './generatePassword';
import {
  DEFAULT_PASSWORD_OPTIONS,
  type PasswordOptions,
  sanitizeOptions,
} from './options';
import { Button } from '@/components/Button';
import { getEntropy } from './strength';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { StrengthBadge } from './components/StrengthBadge';
import { PasswordDisplay } from './components/PasswordDisplay';
import { SECTION_TITLE } from './styles';
import { LengthControl } from './components/LengthControl';
import { OptionsPanel } from './components/OptionsPanel';

export function PasswordGenerator() {
  // Saved options can be anything (edited, corrupted, older version): validate them
  const [storedOptions, setStoredOptions] = useLocalStorage<unknown>(
    'generator.options',
    DEFAULT_PASSWORD_OPTIONS,
  );
  const options = sanitizeOptions(storedOptions);

  const [password, setPassword] = useState(() => generatePassword(options));

  const [copied, setCopied] = useState(false);

  const [turns, setTurns] = useState(0);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

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

      <LengthControl
        length={options.length}
        onChange={(length) => updateOptions({ ...options, length })}
      />

      <OptionsPanel options={options} onChange={updateOptions} />
    </div>
  );
}
