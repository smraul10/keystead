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
    <label>
      <input
        type='checkbox'
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}
