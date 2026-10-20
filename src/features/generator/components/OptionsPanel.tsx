import { Checkbox } from '@/components/Checkbox';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { PasswordOptions } from '../options';
import { SECTION_TITLE } from '../styles';
import { ChevronDown } from 'lucide-react';

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

interface OptionsPanelProps {
  options: PasswordOptions;
  onChange: (options: PasswordOptions) => void;
}

export function OptionsPanel({ options, onChange }: OptionsPanelProps) {
  const [open, setOpen] = useLocalStorage('generator.panelOpen', false);

  const enabledTypes = CHARACTER_TYPES.filter(
    ({ option }) => options[option],
  ).length;

  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className='group border-t border-zinc-200 pt-4 [interpolate-size:allow-keywords] details-content:h-0 details-content:overflow-clip details-content:transition-[height,content-visibility] details-content:transition-discrete details-content:duration-300 open:details-content:h-auto motion-reduce:details-content:transition-none'
    >
      <summary className='flex cursor-pointer list-none items-center justify-between rounded-md text-sm font-medium text-zinc-700'>
        Options
        <ChevronDown className='size-4 text-zinc-500 transition-transform group-open:rotate-180 motion-reduce:transition-none' />
      </summary>

      <div className='flex flex-col gap-5 pt-4'>
        <fieldset className='grid grid-cols-2 gap-2'>
          <legend className={`mb-2 ${SECTION_TITLE}`}>Character types</legend>
          {CHARACTER_TYPES.map(({ option, label }) => (
            <Checkbox
              key={option}
              label={label}
              checked={options[option]}
              disabled={options[option] && enabledTypes === 1}
              onChange={(checked) =>
                onChange({ ...options, [option]: checked })
              }
            />
          ))}
        </fieldset>

        <fieldset className='grid gap-2'>
          <legend className={`mb-2 ${SECTION_TITLE}`}>Rules</legend>
          {RULES.map(({ option, label }) => (
            <Checkbox
              key={option}
              label={label}
              checked={options[option]}
              onChange={(checked) =>
                onChange({ ...options, [option]: checked })
              }
            />
          ))}
        </fieldset>
      </div>
    </details>
  );
}
