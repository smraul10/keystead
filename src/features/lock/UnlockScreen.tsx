import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { DEMO_MASTER_PASSWORD, useLockStore } from './lockStore';

const unlockSchema = z.object({
  masterPassword: z.string().min(1, 'Enter your master password'),
});

type UnlockValues = z.infer<typeof unlockSchema>;

// Replaces the whole window while the vault is locked: nothing of the vault
// is rendered behind it (a popup over the vault would leave its data there)
export function UnlockScreen() {
  const unlock = useLockStore((state) => state.unlock);
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(unlockSchema),
    defaultValues: { masterPassword: '' },
  });
  const error = errors.masterPassword?.message;

  async function submit({ masterPassword }: UnlockValues) {
    if (await unlock(masterPassword)) {
      return;
    }
    // Only the store (Rust, in phase 4) knows the right password, so this
    // error can't come from the schema: set it by hand, like any other
    setError('masterPassword', { message: 'Wrong master password' });
    // Keep what was typed, selected: typing replaces it, or the eye shows it
    setFocus('masterPassword', { shouldSelect: true });
  }

  return (
    <main className='flex h-screen items-center justify-center bg-zinc-100 p-6 text-zinc-900'>
      <form
        noValidate
        onSubmit={handleSubmit(submit)}
        className='flex w-full max-w-sm flex-col gap-5 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm'
      >
        <div className='flex flex-col items-center gap-2 text-center'>
          <LockKeyhole className='size-8 text-emerald-600' />
          <h1 className='text-2xl font-bold'>Keystead</h1>
          <p className='text-sm text-zinc-500'>Your vault is locked</p>
        </div>

        <div className='flex flex-col gap-1.5'>
          <label
            htmlFor={`${id}-password`}
            className='text-sm font-medium text-zinc-700'
          >
            Master password
          </label>
          <div className='flex items-center gap-2'>
            <input
              id={`${id}-password`}
              type={revealed ? 'text' : 'password'}
              autoFocus
              autoComplete='current-password'
              spellCheck={false}
              {...register('masterPassword')}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
              className='w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 font-mono text-sm aria-invalid:border-rose-600'
            />
            <IconButton
              label='Show password'
              aria-pressed={revealed}
              onClick={() => setRevealed((current) => !current)}
            >
              {revealed ? (
                <EyeOff className='size-4' />
              ) : (
                <Eye className='size-4' />
              )}
            </IconButton>
          </div>
          {error && (
            <p id={`${id}-error`} className='text-sm text-rose-700'>
              {error}
            </p>
          )}
        </div>

        <Button variant='primary' type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'Unlocking…' : 'Unlock'}
        </Button>

        {/* TODO(phase 4): remove when the real vault exists */}
        <p className='text-center text-xs text-zinc-500'>
          Demo vault: the master password is{' '}
          <span className='font-mono text-zinc-700'>
            {DEMO_MASTER_PASSWORD}
          </span>
        </p>
      </form>
    </main>
  );
}
