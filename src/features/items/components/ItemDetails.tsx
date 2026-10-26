import { Eye, EyeOff, Pencil, RotateCcw, Star, Trash2 } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import type { Item } from '../item';
import { ItemAvatar } from './ItemAvatar';
import { Button } from '@/components/Button';
import { CopyButton } from '@/features/clipboard';
import { useShortcutHint } from '@/features/settings';
import { IconButton } from '@/components/IconButton';

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
      <dt className='text-zinc-500 dark:text-zinc-400'>{label}</dt>
      <dd className='min-w-0 wrap-break-word'>{children}</dd>
    </>
  );
}

interface ItemDetailsProps {
  item: Item;
  onEdit: () => void;
  onToggleFavorite: () => void;
  onMoveToTrash: () => void;
  onRestore: () => void;
  onDeleteForever: () => void;
}

export function ItemDetails({
  item,
  onEdit,
  onToggleFavorite,
  onMoveToTrash,
  onRestore,
  onDeleteForever,
}: ItemDetailsProps) {
  const [revealed, setRevealed] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  // The shortcuts themselves live in ItemsView: these tell them
  const editHint = useShortcutHint('editItem');
  const copyUsernameHint = useShortcutHint('copyUsername');
  const copyPasswordHint = useShortcutHint('copyPassword');
  const moveToTrashHint = useShortcutHint('moveToTrash');

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center gap-4'>
        <ItemAvatar title={item.title} icon={item.icon} size='lg' />
        <h2 className='min-w-0 flex-1 text-2xl font-bold wrap-break-word'>
          {item.title}
        </h2>
        {/* Trashed items can't be edited or marked until they are restored */}
        {item.deletedAt === null && (
          <div className='flex items-center gap-1'>
            <IconButton label='Edit' onClick={onEdit} {...editHint}>
              <Pencil className='size-5' />
            </IconButton>
            <IconButton
              label='Favorite'
              aria-pressed={item.favorite}
              onClick={onToggleFavorite}
            >
              <Star
                className={
                  item.favorite
                    ? 'size-5 fill-amber-400 text-amber-400'
                    : 'size-5'
                }
              />
            </IconButton>
          </div>
        )}
      </div>

      {item.deletedAt !== null && (
        <div className='flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950'>
          <p className='flex gap-1 text-zinc-600 dark:text-zinc-400'>
            <span>In the trash since</span>
            <time dateTime={item.deletedAt}>
              {DATE_FORMAT.format(new Date(item.deletedAt))}
            </time>
          </p>
          {confirmingDelete ? (
            <div className='flex flex-col gap-2'>
              <p className='font-medium text-rose-700 dark:text-rose-400'>
                Delete forever? This can't be undone.
              </p>
              <div className='flex gap-2'>
                <Button variant='danger' onClick={onDeleteForever}>
                  Yes, delete forever
                </Button>
                {/* The safe option gets the focus, so a stray Enter deletes nothing */}
                <Button autoFocus onClick={() => setConfirmingDelete(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className='flex gap-2'>
              <Button onClick={onRestore}>
                <RotateCcw className='size-4' />
                Restore
              </Button>
              <Button
                variant='danger-subtle'
                onClick={() => setConfirmingDelete(true)}
              >
                <Trash2 className='size-4' />
                Delete forever
              </Button>
            </div>
          )}
        </div>
      )}

      <dl className='grid grid-cols-[8rem_1fr] gap-x-4 gap-y-3 text-sm'>
        {item.username && (
          <Field label='Username'>
            <div className='flex items-center gap-2'>
              <span className='min-w-0 wrap-break-word'>{item.username}</span>
              <CopyButton
                text={item.username}
                label='Copy username'
                hint={copyUsernameHint}
              />
            </div>
          </Field>
        )}
        {item.password && (
          <Field label='Password'>
            <div className='flex items-center gap-2'>
              <span className='font-mono break-all'>
                {revealed ? item.password : PASSWORD_MASK}
              </span>
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
              <CopyButton
                text={item.password}
                label='Copy password'
                hint={copyPasswordHint}
              />
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

      <p className='flex gap-1 text-xs text-zinc-500 dark:text-zinc-400'>
        <span>Last edited</span>
        <time dateTime={item.updatedAt}>
          {DATE_FORMAT.format(new Date(item.updatedAt))}
        </time>
      </p>

      {item.deletedAt === null && (
        // The wrapper keeps the button as wide as its text
        <div>
          <Button
            variant='danger-subtle'
            onClick={onMoveToTrash}
            {...moveToTrashHint}
          >
            <Trash2 className='size-4' />
            Move to trash
          </Button>
        </div>
      )}
    </div>
  );
}
