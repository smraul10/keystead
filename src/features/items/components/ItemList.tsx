import { Star } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import type { Item } from '../item';
import { ItemAvatar } from './ItemAvatar';

interface ItemListProps {
  items: readonly Item[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyMessage: string;
}

export function ItemList({
  items,
  selectedId,
  onSelect,
  emptyMessage,
}: ItemListProps) {
  if (items.length === 0) {
    return (
      <p className='px-3 text-sm text-zinc-500 dark:text-zinc-400'>
        {emptyMessage}
      </p>
    );
  }

  // ↑ ↓ select the previous or next item, and move the focus to it, so a
  // screen reader follows. A convention: not a setting
  function moveWithArrows(event: KeyboardEvent<HTMLUListElement>) {
    const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (step === undefined) return;
    const rows = [...event.currentTarget.querySelectorAll('button')];
    const current = rows.findIndex((row) => row === document.activeElement);
    const next = Math.min(Math.max(current + step, 0), rows.length - 1);
    const item = items[next];
    if (item === undefined) return;
    // Instead of scrolling the list
    event.preventDefault();
    rows[next]?.focus();
    onSelect(item.id);
  }

  return (
    <ul
      aria-label='Items'
      onKeyDown={moveWithArrows}
      className='flex flex-col gap-1'
    >
      {items.map((item) => (
        <li key={item.id}>
          <button
            type='button'
            onClick={() => onSelect(item.id)}
            aria-current={item.id === selectedId ? 'true' : undefined}
            className='flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left transition hover:bg-zinc-100 aria-current:bg-zinc-200 dark:hover:bg-zinc-800 dark:aria-current:bg-zinc-800'
          >
            <ItemAvatar title={item.title} icon={item.icon} />
            <div className='flex min-w-0 flex-col'>
              <span className='flex items-center gap-1 text-sm font-medium'>
                <span className='truncate'>{item.title}</span>
                {item.favorite && (
                  <Star
                    role='img'
                    aria-label='Favorite'
                    className='size-3.5 shrink-0 fill-amber-400 text-amber-400'
                  />
                )}
              </span>
              {item.username && (
                <span className='truncate text-xs text-zinc-500 dark:text-zinc-400'>
                  {item.username}
                </span>
              )}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
