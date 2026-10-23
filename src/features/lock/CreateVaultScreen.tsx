import { zodResolver } from '@hookform/resolvers/zod';
import { TriangleAlert } from 'lucide-react';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { commandErrorOf, errorMessage } from '@/api';
import { Button } from '@/components/Button';
import { CardScreen } from '@/components/CardScreen';
import { PasswordInput } from '@/components/PasswordInput';
import { useLockStore } from './lockStore';

const MIN_LENGTH = 12;

const createVaultSchema = z
  .object({
    // Never trimmed: spaces are part of the password
    masterPassword: z
      .string()
      .min(MIN_LENGTH, `Use at least ${MIN_LENGTH} characters`),
    confirmation: z.string(),
  })
  // A rule about two fields: checked on the object, shown on the confirmation
  .refine((values) => values.confirmation === values.masterPassword, {
    message: "The passwords don't match",
    path: ['confirmation'],
  });

type CreateVaultValues = z.infer<typeof createVaultSchema>;

// First launch: there is no vault yet. Like the unlock screen, it replaces
// the whole window
export function CreateVaultScreen() {
  const createVault = useLockStore((state) => state.createVault);
  const id = useId();
  const [passwordRevealed, setPasswordRevealed] = useState(false);
  const [confirmationRevealed, setConfirmationRevealed] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createVaultSchema),
    defaultValues: { masterPassword: '', confirmation: '' },
  });
  const passwordError = errors.masterPassword?.message;
  const confirmationError = errors.confirmation?.message;
  const failure = errors.root?.message;

  async function submit({ masterPassword }: CreateVaultValues) {
    try {
      await createVault(masterPassword);
    } catch (error) {
      // Not about one field (e.g. the disk is full): an error for the whole
      // form, cleared when it is submitted again
      setError('root', { message: errorMessage(commandErrorOf(error)) });
    }
  }

  return (
    <CardScreen subtitle='Create your vault'>
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
            autoComplete='new-password'
            {...register('masterPassword')}
            aria-invalid={passwordError ? true : undefined}
            aria-describedby={`${id}-password-hint`}
            revealed={passwordRevealed}
            onRevealedChange={setPasswordRevealed}
          />
          {/* The hint, which turns into the error when there is one */}
          <p
            id={`${id}-password-hint`}
            className={
              passwordError ? 'text-sm text-rose-700' : 'text-sm text-zinc-500'
            }
          >
            {passwordError ?? `At least ${MIN_LENGTH} characters`}
          </p>
        </div>

        <div className='flex flex-col gap-1.5'>
          <label
            htmlFor={`${id}-confirmation`}
            className='text-sm font-medium text-zinc-700'
          >
            Confirm master password
          </label>
          <PasswordInput
            id={`${id}-confirmation`}
            autoComplete='new-password'
            {...register('confirmation')}
            aria-invalid={confirmationError ? true : undefined}
            aria-describedby={
              confirmationError ? `${id}-confirmation-error` : undefined
            }
            revealed={confirmationRevealed}
            onRevealedChange={setConfirmationRevealed}
          />
          {confirmationError && (
            <p
              id={`${id}-confirmation-error`}
              className='text-sm text-rose-700'
            >
              {confirmationError}
            </p>
          )}
        </div>

        <p className='flex gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900'>
          <TriangleAlert className='mt-0.5 size-4 shrink-0' />
          Remember your master password: if you forget it, nobody can recover
          your vault.
        </p>

        {failure && (
          <p role='alert' className='text-sm text-rose-700'>
            {failure}
          </p>
        )}

        <Button variant='primary' type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create vault'}
        </Button>
      </form>
    </CardScreen>
  );
}
