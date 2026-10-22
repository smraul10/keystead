import { zodResolver } from '@hookform/resolvers/zod';
import { Dices } from 'lucide-react';
import { type ReactNode, useId, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { IconButton } from '@/components/IconButton';
import { PasswordInput } from '@/components/PasswordInput';
import { type ItemFormValues, itemSchema } from '../itemSchema';
import { GeneratorDialog } from './GeneratorDialog';

const INPUT =
  'w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm aria-invalid:border-rose-600';

interface FieldProps {
  id: string;
  label: string;
  error: string | undefined;
  children: ReactNode;
}

// A label, its control and the error message linked to it
function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className='flex flex-col gap-1.5'>
      <label htmlFor={id} className='text-sm font-medium text-zinc-700'>
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className='text-sm text-rose-700'>
          {error}
        </p>
      )}
    </div>
  );
}

interface ItemFormProps {
  heading: string;
  defaultValues: ItemFormValues;
  onSubmit: (values: ItemFormValues) => void;
  onCancel: () => void;
}

export function ItemForm({
  heading,
  defaultValues,
  onSubmit,
  onCancel,
}: ItemFormProps) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(itemSchema), defaultValues });

  function applyGeneratedPassword(password: string) {
    setValue('password', password, { shouldDirty: true, shouldValidate: true });
    // Show it, so the user sees which password was set
    setRevealed(true);
  }

  // Props that link a control to its error message, if it has one
  function errorProps(field: keyof ItemFormValues) {
    return errors[field]
      ? { 'aria-invalid': true, 'aria-describedby': `${id}-${field}-error` }
      : {};
  }

  return (
    <>
      <form
        noValidate
        onSubmit={handleSubmit((values) => onSubmit(values))}
        className='flex max-w-lg flex-col gap-5'
      >
        <h2 className='text-2xl font-bold'>{heading}</h2>

        <Field id={`${id}-title`} label='Title' error={errors.title?.message}>
          <input
            id={`${id}-title`}
            autoFocus
            {...register('title')}
            {...errorProps('title')}
            className={INPUT}
          />
        </Field>

        <Field
          id={`${id}-username`}
          label='Username'
          error={errors.username?.message}
        >
          <input
            id={`${id}-username`}
            autoComplete='off'
            {...register('username')}
            {...errorProps('username')}
            className={INPUT}
          />
        </Field>

        <Field
          id={`${id}-password`}
          label='Password'
          error={errors.password?.message}
        >
          <PasswordInput
            id={`${id}-password`}
            autoComplete='new-password'
            {...register('password')}
            {...errorProps('password')}
            revealed={revealed}
            onRevealedChange={setRevealed}
            actions={
              <IconButton
                label='Generate password'
                onClick={() => setGeneratorOpen(true)}
              >
                <Dices className='size-4' />
              </IconButton>
            }
          />
        </Field>

        <Field id={`${id}-url`} label='Website' error={errors.url?.message}>
          <input
            id={`${id}-url`}
            autoComplete='off'
            {...register('url')}
            {...errorProps('url')}
            className={INPUT}
          />
        </Field>

        <Field id={`${id}-notes`} label='Notes' error={errors.notes?.message}>
          <textarea
            id={`${id}-notes`}
            rows={4}
            {...register('notes')}
            {...errorProps('notes')}
            className={`${INPUT} resize-y`}
          />
        </Field>

        {/* Checkbox is a controlled component: Controller connects it */}
        <Controller
          control={control}
          name='favorite'
          render={({ field }) => (
            <Checkbox
              label='Favorite'
              checked={field.value}
              onChange={field.onChange}
            />
          )}
        />

        <div className='flex gap-2'>
          <Button variant='primary' type='submit'>
            Save
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </div>
      </form>

      {/* Outside the <form>: pressing Enter in the generator must not save */}
      {generatorOpen && (
        <GeneratorDialog
          onUse={applyGeneratedPassword}
          onClose={() => setGeneratorOpen(false)}
        />
      )}
    </>
  );
}
