import {
  Dices,
  Lock,
  type LucideIcon,
  Settings,
  Star,
  Trash2,
  Vault,
} from 'lucide-react';
import type { ItemFilter } from '@/features/items';

export type Section = ItemFilter | 'generator' | 'settings';

const SECTIONS: {
  id: Exclude<Section, 'settings'>;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: 'all', label: 'All items', icon: Vault },
  { id: 'favorites', label: 'Favorites', icon: Star },
  { id: 'trash', label: 'Trash', icon: Trash2 },
  { id: 'generator', label: 'Generator', icon: Dices },
];

// The sidebar rows share one look: a full-width row, highlighted when current
const ROW =
  'flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 aria-[current=page]:bg-zinc-200 aria-[current=page]:text-zinc-900';

interface SidebarProps {
  current: Section;
  onSelect: (section: Section) => void;
  onLock: () => void;
}

export function Sidebar({ current, onSelect, onLock }: SidebarProps) {
  return (
    <div className='flex w-56 shrink-0 flex-col gap-6 border-r border-zinc-200 bg-zinc-50 p-4'>
      <p className='px-3 text-lg font-bold'>Keystead</p>
      {/* flex-1 pushes Settings and Lock to the bottom */}
      <nav aria-label='Sections' className='flex-1'>
        <ul className='flex flex-col gap-1'>
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <button
                type='button'
                onClick={() => onSelect(id)}
                aria-current={current === id ? 'page' : undefined}
                className={ROW}
              >
                <Icon className='size-4' />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className='flex flex-col gap-1 border-t border-zinc-200 pt-4'>
        <button
          type='button'
          onClick={() => onSelect('settings')}
          aria-current={current === 'settings' ? 'page' : undefined}
          className={ROW}
        >
          <Settings className='size-4' />
          Settings
        </button>
        <button type='button' onClick={onLock} className={ROW}>
          <Lock className='size-4' />
          Lock
        </button>
      </div>
    </div>
  );
}
