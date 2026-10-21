import { useState } from 'react';
import { ItemDetails } from './components/ItemDetails';
import { ItemList } from './components/ItemList';
import { SearchField } from './components/SearchField';
import { filterItems } from './filterItems';
import { type ItemFilter, itemsInView } from './itemsInView';
import { useItemsStore } from './itemsStore';
import { sortItems } from './sortItems';

const TITLES: Record<ItemFilter, string> = {
  all: 'All items',
  favorites: 'Favorites',
  trash: 'Trash',
};

const EMPTY_MESSAGES: Record<ItemFilter, string> = {
  all: 'No items yet',
  favorites: 'No favorites yet',
  trash: 'The trash is empty',
};

interface ItemsViewProps {
  filter?: ItemFilter;
}

export function ItemsView({ filter = 'all' }: ItemsViewProps) {
  const items = useItemsStore((state) => state.items);
  const toggleFavorite = useItemsStore((state) => state.toggleFavorite);
  const moveToTrash = useItemsStore((state) => state.moveToTrash);
  const restore = useItemsStore((state) => state.restore);
  const deleteForever = useItemsStore((state) => state.deleteForever);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const inView = itemsInView(items, filter);
  const visibleItems = sortItems(filterItems(inView, query));
  // Search all items: the details stay open even if the item leaves the view
  const selected = items.find((item) => item.id === selectedId);

  // After trashing, restoring or deleting, the item no longer belongs here
  function runAndClose(action: (id: string) => void, id: string) {
    action(id);
    setSelectedId(null);
  }

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
            inView.length === 0
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
            onMoveToTrash={() => runAndClose(moveToTrash, selected.id)}
            onRestore={() => runAndClose(restore, selected.id)}
            onDeleteForever={() => runAndClose(deleteForever, selected.id)}
          />
        ) : (
          <p className='text-zinc-500'>Select an item</p>
        )}
      </section>
    </div>
  );
}
