import { type CharType, getCharType } from '../getCharType';

const CHAR_TYPE_COLORS: Record<CharType, string> = {
  letter: '',
  digit: 'text-blue-600 dark:text-blue-400',
  symbol: 'text-rose-600 dark:text-rose-400',
};

interface PasswordDisplayProps {
  password: string;
}

export function PasswordDisplay({ password }: PasswordDisplayProps) {
  return (
    <output
      aria-label='Generated password'
      className='rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 font-mono text-lg tracking-wider break-all dark:border-zinc-700 dark:bg-zinc-950'
    >
      {password.split('').map((char, index) => (
        <span key={index} className={CHAR_TYPE_COLORS[getCharType(char)]}>
          {char}
        </span>
      ))}
    </output>
  );
}
