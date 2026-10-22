import { Plus } from 'lucide-react';
import { useState } from 'react';
import { ItemDetails } from './components/ItemDetails';
import { ItemForm } from './components/ItemForm';
import { ItemList } from './components/ItemList';
import { SearchField } from './components/SearchField';
import { filterItems } from './filterItems';
import { EMPTY_ITEM_VALUES, type ItemFormValues } from './itemSchema';
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

// What the details column shows. A single state for every case, so impossible
// combinations (like creating and showing details at once) can't happen
type Panel =
  | { kind: 'empty' }
  | { kind: 'details'; id: string }
  // `returnTo`: the item to show again if the user cancels
  | { kind: 'new'; returnTo: string | null };

const EMPTY_PANEL: Panel = { kind: 'empty' };

function detailsOrEmpty(id: string | null): Panel {
  return id === null ? EMPTY_PANEL : { kind: 'details', id };
}

// The item highlighted in the list while each panel is open
function highlightedId(panel: Panel): string | null {
  switch (panel.kind) {
    case 'empty':
      return null;
    case 'details':
      return panel.id;
    case 'new':
      return panel.returnTo;
  }
}

interface ItemsViewProps {
  filter?: ItemFilter;
}

export function ItemsView({ filter = 'all' }: ItemsViewProps) {
  const items = useItemsStore((state) => state.items);
  const toggleFavorite = useItemsStore((state) => state.toggleFavorite);
  const moveToTrash = useItemsStore((state) => state.moveToTrash);
  const restore = useItemsStore((state) => state.restore);
  const deleteForever = useItemsStore((state) => state.deleteForever);
  const addItem = useItemsStore((state) => state.addItem);
  const [panel, setPanel] = useState<Panel>(EMPTY_PANEL);
  const [query, setQuery] = useState('');
  const inView = itemsInView(items, filter);
  const visibleItems = sortItems(filterItems(inView, query));

  // After trashing, restoring or deleting, the item no longer belongs here
  function runAndClose(action: (id: string) => void, id: string) {
    action(id);
    setPanel(EMPTY_PANEL);
  }

  function select(id: string) {
    setPanel({ kind: 'details', id });
  }

  function create(values: ItemFormValues) {
    select(addItem(values));
  }

  function renderPanel() {
    switch (panel.kind) {
      case 'empty':
        return <p className='text-zinc-500'>Select an item</p>;
      case 'new':
        return (
          <ItemForm
            heading='New item'
            // Created from Favorites, an item starts as a favorite
            defaultValues={{
              ...EMPTY_ITEM_VALUES,
              favorite: filter === 'favorites',
            }}
            onSubmit={create}
            onCancel={() => setPanel(detailsOrEmpty(panel.returnTo))}
          />
        );
      case 'details': {
        // Search all items: the details stay open even if the item leaves the view
        const item = items.find((candidate) => candidate.id === panel.id);
        if (item === undefined) {
          return <p className='text-zinc-500'>Select an item</p>;
        }
        return (
          <ItemDetails
            key={item.id}
            item={item}
            onToggleFavorite={() => toggleFavorite(item.id)}
            onMoveToTrash={() => runAndClose(moveToTrash, item.id)}
            onRestore={() => runAndClose(restore, item.id)}
            onDeleteForever={() => runAndClose(deleteForever, item.id)}
          />
        );
      }
    }
  }

  return (
    <div className='flex h-full'>
      <section className='flex w-72 shrink-0 flex-col gap-4 overflow-y-auto border-r border-zinc-200 p-4'>
        <div className='flex items-center justify-between gap-2 px-3'>
          <h1 className='text-xl font-bold'>{TITLES[filter]}</h1>
          {filter !== 'trash' && (
            <button
              type='button'
              aria-label='New item'
              onClick={() =>
                setPanel({ kind: 'new', returnTo: highlightedId(panel) })
              }
              className='cursor-pointer rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900'
            >
              <Plus className='size-5' />
            </button>
          )}
        </div>
        <SearchField value={query} onChange={setQuery} />
        <ItemList
          items={visibleItems}
          selectedId={highlightedId(panel)}
          onSelect={select}
          emptyMessage={
            inView.length === 0
              ? EMPTY_MESSAGES[filter]
              : 'No items match your search'
          }
        />
      </section>

      <section className='flex-1 overflow-y-auto p-8'>{renderPanel()}</section>
    </div>
  );
}
