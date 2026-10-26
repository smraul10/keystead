import { useId, useState } from 'react';
import { isValidLength, MAX_LENGTH, MIN_LENGTH } from '../options';
import { SECTION_TITLE } from '../styles';

interface LengthControlProps {
  length: number;
  onChange: (length: number) => void;
}

export function LengthControl({ length, onChange }: LengthControlProps) {
  const id = useId();
  // What the user is typing in the number input, while editing
  const [draft, setDraft] = useState<string | null>(null);

  function changeDraft(value: string) {
    setDraft(value);
    const next = Number(value);
    if (isValidLength(next)) {
      onChange(next);
    }
  }

  return (
    <div className='flex flex-col gap-2'>
      <label htmlFor={id} className={SECTION_TITLE}>
        Length
      </label>
      <div className='flex items-center gap-3'>
        <input
          id={id}
          type='range'
          min={MIN_LENGTH}
          max={MAX_LENGTH}
          value={length}
          onChange={(event) => onChange(Number(event.target.value))}
          className='flex-1 cursor-pointer accent-emerald-600 dark:accent-emerald-500'
        />
        <input
          type='number'
          aria-label='Length'
          min={MIN_LENGTH}
          max={MAX_LENGTH}
          value={draft ?? length}
          onChange={(event) => changeDraft(event.target.value)}
          onBlur={() => setDraft(null)}
          className='w-16 rounded-md border border-zinc-300 bg-zinc-50 px-2 py-1 text-right font-mono dark:border-zinc-700 dark:bg-zinc-950'
        />
      </div>
    </div>
  );
}
