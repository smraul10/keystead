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
      <input
        type='checkbox'
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className='size-4 accent-emerald-600'
      />
      {label}
    </label>
  );
}
