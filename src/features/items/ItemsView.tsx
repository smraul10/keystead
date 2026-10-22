import { Plus } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { IconButton } from '@/components/IconButton';
import { ItemDetails } from './components/ItemDetails';
import { ItemForm } from './components/ItemForm';
import { ItemList } from './components/ItemList';
import { SearchField } from './components/SearchField';
import { filterItems } from './filterItems';
import {
  EMPTY_ITEM_VALUES,
  type ItemFormValues,
  toFormValues,
} from './itemSchema';
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
  | { kind: 'new'; returnTo: string | null }
  | { kind: 'edit'; id: string };

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
    case 'edit':
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
  const updateItem = useItemsStore((state) => state.updateItem);
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

  // Search all items: the panel stays open even if the item leaves the view
  function findItem(id: string) {
    return items.find((item) => item.id === id);
  }

  function renderPanel(): ReactElement {
    const nothingSelected = <p className='text-zinc-500'>Select an item</p>;

    switch (panel.kind) {
      case 'empty':
        return nothingSelected;
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
      case 'edit': {
        const item = findItem(panel.id);
        if (item === undefined) {
          return nothingSelected;
        }
        return (
          <ItemForm
            key={item.id}
            heading='Edit item'
            defaultValues={toFormValues(item)}
            onSubmit={(values) => {
              updateItem(item.id, values);
              select(item.id);
            }}
            onCancel={() => select(item.id)}
          />
        );
      }
      case 'details': {
        const item = findItem(panel.id);
        if (item === undefined) {
          return nothingSelected;
        }
        return (
          <ItemDetails
            key={item.id}
            item={item}
            onEdit={() => setPanel({ kind: 'edit', id: item.id })}
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
            <IconButton
              label='New item'
              onClick={() =>
                setPanel({ kind: 'new', returnTo: highlightedId(panel) })
              }
            >
              <Plus className='size-5' />
            </IconButton>
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
