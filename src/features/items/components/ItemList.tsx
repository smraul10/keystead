import type { Item } from '../item';

interface ItemListProps {
  items: readonly Item[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ItemList({ items, selectedId, onSelect }: ItemListProps) {
  if (items.length === 0) {
    return <p className='px-3 text-sm text-zinc-500'>No items yet</p>;
  }

  return (
    <ul aria-label='Items' className='flex flex-col gap-1'>
      {items.map((item) => (
        <li key={item.id}>
          <button
            type='button'
            onClick={() => onSelect(item.id)}
            aria-current={item.id === selectedId ? 'true' : undefined}
            className='flex w-full cursor-pointer flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left transition hover:bg-zinc-100 aria-[current=true]:bg-zinc-200'
          >
            <span className='w-full truncate text-sm font-medium'>
              {item.title}
            </span>
            {item.username && (
              <span className='w-full truncate text-xs text-zinc-500'>
                {item.username}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
