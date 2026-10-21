import { Eye, EyeOff, RotateCcw, Star, Trash2 } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import type { Item } from '../item';
import { ItemAvatar } from './ItemAvatar';
import { Button } from '@/components/Button';
import { CopyButton } from '@/components/CopyButton';

// Always the same number of dots, so the password length is not revealed
const PASSWORD_MASK = '••••••••';

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

interface FieldProps {
  label: string;
  children: ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <>
      <dt className='text-zinc-500'>{label}</dt>
      <dd className='min-w-0 wrap-break-word'>{children}</dd>
    </>
  );
}

interface ItemDetailsProps {
  item: Item;
  onToggleFavorite: () => void;
  onMoveToTrash: () => void;
  onRestore: () => void;
  onDeleteForever: () => void;
}

export function ItemDetails({
  item,
  onToggleFavorite,
  onMoveToTrash,
  onRestore,
  onDeleteForever,
}: ItemDetailsProps) {
  const [revealed, setRevealed] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center gap-4'>
        <ItemAvatar title={item.title} size='lg' />
        <h2 className='min-w-0 flex-1 text-2xl font-bold wrap-break-word'>
          {item.title}
        </h2>
        {item.deletedAt === null && (
          <button
            type='button'
            aria-label='Favorite'
            aria-pressed={item.favorite}
            onClick={onToggleFavorite}
            className='cursor-pointer rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900'
          >
            <Star
              className={
                item.favorite
                  ? 'size-5 fill-amber-400 text-amber-400'
                  : 'size-5'
              }
            />
          </button>
        )}
      </div>

      {item.deletedAt !== null && (
        <div className='flex flex-col gap-3 rounded-lg bg-zinc-100 p-4 text-sm'>
          <p className='flex gap-1 text-zinc-600'>
            <span>In the trash since</span>
            <time dateTime={item.deletedAt}>
              {DATE_FORMAT.format(new Date(item.deletedAt))}
            </time>
          </p>
          {confirmingDelete ? (
            <div className='flex flex-col gap-2'>
              <p className='font-medium text-rose-700'>
                Delete forever? This can't be undone.
              </p>
              <div className='flex gap-2'>
                <button
                  type='button'
                  onClick={onDeleteForever}
                  className='cursor-pointer rounded-lg bg-rose-600 px-3 py-1.5 font-medium text-white transition hover:bg-rose-700 motion-safe:active:scale-95'
                >
                  Yes, delete forever
                </button>
                {/* The safe option gets the focus, so a stray Enter deletes nothing */}
                <button
                  type='button'
                  autoFocus
                  onClick={() => setConfirmingDelete(false)}
                  className='cursor-pointer rounded-lg bg-white px-3 py-1.5 font-medium transition hover:bg-zinc-200 motion-safe:active:scale-95'
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className='flex gap-2'>
              <Button onClick={onRestore}>
                <RotateCcw className='size-4' />
                Restore
              </Button>
              <button
                type='button'
                onClick={() => setConfirmingDelete(true)}
                className='flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-rose-700 transition hover:bg-rose-50 motion-safe:active:scale-95'
              >
                <Trash2 className='size-4' />
                Delete forever
              </button>
            </div>
          )}
        </div>
      )}

      <dl className='grid grid-cols-[8rem_1fr] gap-x-4 gap-y-3 text-sm'>
        {item.username && (
          <Field label='Username'>
            <div className='flex items-center gap-2'>
              <span className='min-w-0 wrap-break-word'>{item.username}</span>
              <CopyButton text={item.username} label='Copy username' />
            </div>
          </Field>
        )}
        {item.password && (
          <Field label='Password'>
            <div className='flex items-center gap-2'>
              <span className='font-mono break-all'>
                {revealed ? item.password : PASSWORD_MASK}
              </span>
              <button
                type='button'
                aria-label='Show password'
                aria-pressed={revealed}
                onClick={() => setRevealed((current) => !current)}
                className='cursor-pointer rounded-md p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900'
              >
                {revealed ? (
                  <EyeOff className='size-4' />
                ) : (
                  <Eye className='size-4' />
                )}
              </button>
              <CopyButton text={item.password} label='Copy password' />
            </div>
          </Field>
        )}
        {item.url && <Field label='Website'>{item.url}</Field>}
        {item.notes && (
          <Field label='Notes'>
            <p className='whitespace-pre-wrap'>{item.notes}</p>
          </Field>
        )}
      </dl>

      <p className='flex gap-1 text-xs text-zinc-500'>
        <span>Last edited</span>
        <time dateTime={item.updatedAt}>
          {DATE_FORMAT.format(new Date(item.updatedAt))}
        </time>
      </p>

      {item.deletedAt === null && (
        <button
          type='button'
          onClick={onMoveToTrash}
          className='flex cursor-pointer items-center gap-1.5 self-start rounded-lg px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50 motion-safe:active:scale-95'
        >
          <Trash2 className='size-4' />
          Move to trash
        </button>
      )}
    </div>
  );
}
