import { zodResolver } from '@hookform/resolvers/zod';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { commandErrorOf, errorMessage } from '@/api';
import { Button } from '@/components/Button';
import { CardScreen } from '@/components/CardScreen';
import { PasswordInput } from '@/components/PasswordInput';
import { useLockStore } from './lockStore';

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
  const failure = errors.root?.message;

  async function submit({ masterPassword }: UnlockValues) {
    try {
      await unlock(masterPassword);
    } catch (thrown) {
      const commandError = commandErrorOf(thrown);
      if (commandError.kind === 'wrongPassword') {
        // Only Rust knows the right password, so this error can't come from
        // the schema: set it by hand, like any other
        setError('masterPassword', { message: errorMessage(commandError) });
        // Keep what was typed, selected: typing replaces it, or the eye
        // shows the typo
        setFocus('masterPassword', { shouldSelect: true });
      } else {
        // Not about the password (e.g. a damaged file): an error for the
        // whole form, cleared when it is submitted again
        setError('root', { message: errorMessage(commandError) });
      }
    }
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
            className='text-sm font-medium text-zinc-700 dark:text-zinc-300'
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
            <p
              id={`${id}-error`}
              className='text-sm text-rose-700 dark:text-rose-400'
            >
              {error}
            </p>
          )}
        </div>

        {failure && (
          <p role='alert' className='text-sm text-rose-700 dark:text-rose-400'>
            {failure}
          </p>
        )}

        <Button variant='primary' type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'Unlocking…' : 'Unlock'}
        </Button>
      </form>
    </CardScreen>
  );
}
