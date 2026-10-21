import { useState } from 'react';
import { ItemDetails } from './components/ItemDetails';
import { ItemList } from './components/ItemList';
import { SearchField } from './components/SearchField';
import { filterItems } from './filterItems';
import type { Item } from './item';
import { sortItems } from './sortItems';

interface ItemsViewProps {
  items: readonly Item[];
}

export function ItemsView({ items }: ItemsViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const visibleItems = sortItems(filterItems(items, query));
  const selected = items.find((item) => item.id === selectedId);

  return (
    <div className='flex h-full'>
      <section className='flex w-72 shrink-0 flex-col gap-4 overflow-y-auto border-r border-zinc-200 p-4'>
        <h1 className='px-3 text-xl font-bold'>All items</h1>
        <SearchField value={query} onChange={setQuery} />
        <ItemList
          items={visibleItems}
          selectedId={selectedId}
          onSelect={setSelectedId}
          emptyMessage={
            items.length === 0 ? 'No items yet' : 'No items match your search'
          }
        />
      </section>

      <section className='flex-1 overflow-y-auto p-8'>
        {selected ? (
          <ItemDetails key={selected.id} item={selected} />
        ) : (
          <p className='text-zinc-500'>Select an item</p>
        )}
      </section>
    </div>
  );
}
