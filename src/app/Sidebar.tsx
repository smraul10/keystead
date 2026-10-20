import { Dices, type LucideIcon, Vault } from 'lucide-react';

export type Section = 'all' | 'generator';

const SECTIONS: { id: Section; label: string; icon: LucideIcon }[] = [
  { id: 'all', label: 'All items', icon: Vault },
  { id: 'generator', label: 'Generator', icon: Dices },
];

interface SidebarProps {
  current: Section;
  onSelect: (section: Section) => void;
}

export function Sidebar({ current, onSelect }: SidebarProps) {
  return (
    <div className='flex w-56 shrink-0 flex-col gap-6 border-r border-zinc-200 bg-zinc-50 p-4'>
      <p className='px-3 text-lg font-bold'>Keystead</p>
      <nav aria-label='Sections'>
        <ul className='flex flex-col gap-1'>
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <button
                type='button'
                onClick={() => onSelect(id)}
                aria-current={current === id ? 'page' : undefined}
                className='flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 aria-[current=page]:bg-zinc-200 aria-[current=page]:text-zinc-900'
              >
                <Icon className='size-4' />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
