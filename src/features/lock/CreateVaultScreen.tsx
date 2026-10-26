import { zodResolver } from '@hookform/resolvers/zod';
import { TriangleAlert } from 'lucide-react';
import { useId, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { commandErrorOf, errorMessage } from '@/api';
import { Button } from '@/components/Button';
import { CardScreen } from '@/components/CardScreen';
import { PasswordInput } from '@/components/PasswordInput';
import {
  getStrength,
  loadEstimator,
  PasswordStrength,
} from '@/features/strength';
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
  // The weak master password the user is being asked about, if any
  const [weakPassword, setWeakPassword] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createVaultSchema),
    defaultValues: { masterPassword: '', confirmation: '' },
  });
  const masterPassword = useWatch({ control, name: 'masterPassword' });
  const passwordError = errors.masterPassword?.message;
  const confirmationError = errors.confirmation?.message;
  const failure = errors.root?.message;
  // Changing the password ends the question: the new one is checked again
  const askingAboutWeak =
    weakPassword !== null && weakPassword === masterPassword;

  async function create(masterPassword: string) {
    try {
      await createVault(masterPassword);
    } catch (error) {
      // Not about one field (e.g. the disk is full): an error for the whole
      // form, cleared when it is submitted again
      setError('root', { message: errorMessage(commandErrorOf(error)) });
    }
  }

  // "Create vault" (or Enter). Like Bitwarden, a weak master password is
  // allowed, but never by accident: it is asked about first
  async function submit({ masterPassword }: CreateVaultValues) {
    const estimateBits = await loadEstimator();
    const strength = getStrength(estimateBits(masterPassword));
    if (strength === 'poor' || strength === 'weak') {
      setWeakPassword(masterPassword);
      return;
    }
    await create(masterPassword);
  }

  // "Use it anyway": the form is still checked, but not the strength
  const createAnyway = handleSubmit(({ masterPassword }) =>
    create(masterPassword),
  );

  function chooseAnother() {
    setWeakPassword(null);
    // Selected: typing replaces it, or the eye shows it
    setFocus('masterPassword', { shouldSelect: true });
  }

  return (
    <CardScreen subtitle='Create your vault'>
      <form
        noValidate
        onSubmit={handleSubmit(submit)}
        className='flex flex-col gap-5'
      >
        <div className='flex flex-col gap-1.5'>
          <div className='flex items-center justify-between gap-2'>
            <label
              htmlFor={`${id}-password`}
              className='text-sm font-medium text-zinc-700'
            >
              Master password
            </label>
            <PasswordStrength password={masterPassword} />
          </div>
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

        {askingAboutWeak ? (
          <div className='flex flex-col gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900'>
            <p id={`${id}-weak`}>
              This master password is weak: someone could guess it. Use it
              anyway?
            </p>
            {/* The safe answer has the focus, and reads the question */}
            <div className='flex gap-2'>
              <Button
                variant='primary'
                autoFocus
                aria-describedby={`${id}-weak`}
                onClick={chooseAnother}
              >
                Choose another
              </Button>
              <Button onClick={createAnyway} disabled={isSubmitting}>
                {isSubmitting ? 'Creating…' : 'Use it anyway'}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant='primary' type='submit' disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create vault'}
          </Button>
        )}
      </form>
    </CardScreen>
  );
}
