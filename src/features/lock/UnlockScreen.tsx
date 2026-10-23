import { zodResolver } from '@hookform/resolvers/zod';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/Button';
import { CardScreen } from '@/components/CardScreen';
import { PasswordInput } from '@/components/PasswordInput';
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
    // Only the store (Rust, in the next PR) knows the right password, so this
    // error can't come from the schema: set it by hand, like any other
    setError('masterPassword', { message: 'Wrong master password' });
    // Keep what was typed, selected: typing replaces it, or the eye shows it
    setFocus('masterPassword', { shouldSelect: true });
  }

  return (
    <CardScreen subtitle='Your vault is locked'>
      <form
        noValidate
        onSubmit={handleSubmit(submit)}
        className='flex flex-col gap-5'
      >
        <div className='flex flex-col gap-1.5'>
          <label
            htmlFor={`${id}-password`}
            className='text-sm font-medium text-zinc-700'
          >
            Master password
          </label>
          <PasswordInput
            id={`${id}-password`}
            autoFocus
            autoComplete='current-password'
            {...register('masterPassword')}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            revealed={revealed}
            onRevealedChange={setRevealed}
          />
          {error && (
            <p id={`${id}-error`} className='text-sm text-rose-700'>
              {error}
            </p>
          )}
        </div>

        <Button variant='primary' type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'Unlocking…' : 'Unlock'}
        </Button>

        {/* TODO(phase 4): remove when unlocking opens the real vault */}
        <p className='text-center text-xs text-zinc-500'>
          Demo vault: the master password is{' '}
          <span className='font-mono text-zinc-700'>
            {DEMO_MASTER_PASSWORD}
          </span>
        </p>
      </form>
    </CardScreen>
  );
}
