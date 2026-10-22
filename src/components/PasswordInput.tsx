import { Eye, EyeOff } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { IconButton } from './IconButton';

// Accepts every attribute of an <input> (id, autoFocus, aria-*, and what
// React Hook Form's register() returns, ref included) except type and
// className: the field always looks the same and switches type itself
interface PasswordInputProps extends Omit<
  ComponentProps<'input'>,
  'type' | 'className'
> {
  // Controlled by the parent, which may need to show it (e.g. "Use password")
  revealed: boolean;
  onRevealedChange: (revealed: boolean) => void;
  // More icon buttons inside the field, after the eye (e.g. the generator)
  actions?: ReactNode;
}

// A password field with its buttons inside the border, on the right
export function PasswordInput({
  revealed,
  onRevealedChange,
  actions,
  ...props
}: PasswordInputProps) {
  return (
    <div className='relative'>
      <input
        type={revealed ? 'text' : 'password'}
        spellCheck={false}
        {...props}
        // Room on the right, so the text never runs under the buttons
        className={`w-full rounded-md border border-zinc-300 bg-white py-1.5 pl-3 font-mono text-sm aria-invalid:border-rose-600 ${actions ? 'pr-18' : 'pr-10'}`}
      />
      <div className='absolute inset-y-0 right-1 flex items-center gap-0.5'>
        <IconButton
          label='Show password'
          aria-pressed={revealed}
          onClick={() => onRevealedChange(!revealed)}
        >
          {revealed ? (
            <EyeOff className='size-4' />
          ) : (
            <Eye className='size-4' />
          )}
        </IconButton>
        {actions}
      </div>
    </div>
  );
}
