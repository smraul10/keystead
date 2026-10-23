import { Star } from 'lucide-react';
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
    return <p className='px-3 text-sm text-zinc-500'>{emptyMessage}</p>;
  }

  return (
    <ul aria-label='Items' className='flex flex-col gap-1'>
      {items.map((item) => (
        <li key={item.id}>
          <button
            type='button'
            onClick={() => onSelect(item.id)}
            aria-current={item.id === selectedId ? 'true' : undefined}
            className='flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left transition hover:bg-zinc-100 aria-current:bg-zinc-200'
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
                <span className='truncate text-xs text-zinc-500'>
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
