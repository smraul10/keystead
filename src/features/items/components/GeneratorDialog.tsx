import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { IconButton } from '@/components/IconButton';
import { PasswordGenerator } from '@/features/generator';

interface GeneratorDialogProps {
  onUse: (password: string) => void;
  onClose: () => void;
}

// The password generator in a native modal <dialog>: it traps the focus,
// closes with Esc and makes the rest of the page inert. It opens as soon as
// it is rendered, so the parent decides when it exists.
export function GeneratorDialog({ onUse, onClose }: GeneratorDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // showModal() is a method of the DOM element, not a React prop
  useEffect(() => {
    const dialog = ref.current;
    if (dialog !== null && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  // Closing the dialog (Esc, the X button or after using a password) fires
  // its "close" event, which tells the parent through onClose
  function close() {
    ref.current?.close();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className='m-auto rounded-xl bg-zinc-50 p-4 shadow-xl backdrop:bg-zinc-900/40'
    >
      <div className='flex flex-col gap-3'>
        <div className='flex items-center justify-between gap-4'>
          <h2 id={titleId} className='text-lg font-bold'>
            Generate password
          </h2>
          <IconButton label='Close' onClick={close}>
            <X className='size-5' />
          </IconButton>
        </div>
        <PasswordGenerator
          onUse={(password) => {
            onUse(password);
            close();
          }}
        />
      </div>
    </dialog>
  );
}
