interface CheckboxProps {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export function Checkbox({
  label,
  checked,
  disabled,
  onChange,
}: CheckboxProps) {
  return (
    <label className='flex cursor-pointer items-center gap-2 has-disabled:cursor-not-allowed has-disabled:opacity-50'>
      <span className='grid size-4 shrink-0'>
        <input
          type='checkbox'
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className='peer col-start-1 row-start-1 size-4 cursor-pointer appearance-none rounded border border-zinc-300 bg-white transition-colors checked:border-emerald-600 checked:bg-emerald-600 disabled:cursor-not-allowed dark:border-zinc-600 dark:bg-zinc-900 forced-colors:appearance-auto'
        />
        <svg
          aria-hidden='true'
          viewBox='0 0 16 16'
          className='pointer-events-none col-start-1 row-start-1 size-4 scale-50 text-white opacity-0 transition peer-checked:scale-100 peer-checked:opacity-100 motion-reduce:transition-none forced-colors:hidden'
        >
          <path
            d='M4 8.5l2.5 2.5L12 5.5'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </span>
      {label}
    </label>
  );
}
