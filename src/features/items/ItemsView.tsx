import { useState } from 'react';
import { ItemDetails } from './components/ItemDetails';
import { ItemList } from './components/ItemList';
import { SearchField } from './components/SearchField';
import { filterItems } from './filterItems';
import { useItemsStore } from './itemsStore';
import { sortItems } from './sortItems';

export type ItemFilter = 'all' | 'favorites';

const TITLES: Record<ItemFilter, string> = {
  all: 'All items',
  favorites: 'Favorites',
};

const EMPTY_MESSAGES: Record<ItemFilter, string> = {
  all: 'No items yet',
  favorites: 'No favorites yet',
};

interface ItemsViewProps {
  filter?: ItemFilter;
}

export function ItemsView({ filter = 'all' }: ItemsViewProps) {
  const items = useItemsStore((state) => state.items);
  const toggleFavorite = useItemsStore((state) => state.toggleFavorite);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const itemsInView =
    filter === 'favorites' ? items.filter((item) => item.favorite) : items;
  const visibleItems = sortItems(filterItems(itemsInView, query));
  // Search all items: the details stay open even if the item leaves the view
  const selected = items.find((item) => item.id === selectedId);

  return (
    <div className='flex h-full'>
      <section className='flex w-72 shrink-0 flex-col gap-4 overflow-y-auto border-r border-zinc-200 p-4'>
        <h1 className='px-3 text-xl font-bold'>{TITLES[filter]}</h1>
        <SearchField value={query} onChange={setQuery} />
        <ItemList
          items={visibleItems}
          selectedId={selectedId}
          onSelect={setSelectedId}
          emptyMessage={
            itemsInView.length === 0
              ? EMPTY_MESSAGES[filter]
              : 'No items match your search'
          }
        />
      </section>

      <section className='flex-1 overflow-y-auto p-8'>
        {selected ? (
          <ItemDetails
            key={selected.id}
            item={selected}
            onToggleFavorite={() => toggleFavorite(selected.id)}
          />
        ) : (
          <p className='text-zinc-500'>Select an item</p>
        )}
      </section>
    </div>
  );
}
