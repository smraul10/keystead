import { useState } from 'react';
import { generatePassword } from './generatePassword';
import {
  DEFAULT_PASSWORD_OPTIONS,
  type PasswordOptions,
  sanitizeOptions,
} from './options';
import { Button } from '@/components/Button';
import { StrengthBadge } from '@/features/strength';
import { getEntropy } from './strength';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { PasswordDisplay } from './components/PasswordDisplay';
import { SECTION_TITLE } from './styles';
import { LengthControl } from './components/LengthControl';
import { OptionsPanel } from './components/OptionsPanel';
import { Check, Copy, RefreshCw, X } from 'lucide-react';
import { useCopyToClipboard } from '@/features/clipboard';

interface PasswordGeneratorProps {
  // Given inside the item form: shows a "Use password" button
  onUse?: (password: string) => void;
}

export function PasswordGenerator({ onUse }: PasswordGeneratorProps) {
  // Saved options can be anything (edited, corrupted, older version): validate them
  const [storedOptions, setStoredOptions] = useLocalStorage<unknown>(
    'generator.options',
    DEFAULT_PASSWORD_OPTIONS,
  );
  const options = sanitizeOptions(storedOptions);

  const [password, setPassword] = useState(() => generatePassword(options));

  const [turns, setTurns] = useState(0);

  const { copied, failed, copy, reset } = useCopyToClipboard();

  function updateOptions(next: PasswordOptions) {
    setStoredOptions(next);
    setPassword(generatePassword(next));
    reset();
  }

  function regenerate() {
    setPassword(generatePassword(options));
    reset();
    setTurns((current) => current + 1);
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
            <RefreshCw
              className='size-4 transition-transform duration-500 motion-reduce:transition-none'
              style={{ transform: `rotate(${turns}turn)` }}
            />
            Regenerate
          </Button>

          <Button onClick={() => copy(password)}>
            {copied && <Check className='size-4' />}
            {failed && <X className='size-4' />}
            {!copied && !failed && <Copy className='size-4' />}
            {copied ? 'Copied' : failed ? "Couldn't copy" : 'Copy'}
          </Button>
        </div>

        {onUse && (
          <Button variant='primary' onClick={() => onUse(password)}>
            Use password
          </Button>
        )}
      </div>

      <LengthControl
        length={options.length}
        onChange={(length) => updateOptions({ ...options, length })}
      />

      <OptionsPanel options={options} onChange={updateOptions} />
    </div>
  );
}
