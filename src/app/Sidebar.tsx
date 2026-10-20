export type Section = 'all' | 'generator';

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'all', label: 'All items' },
  { id: 'generator', label: 'Generator' },
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
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <button
                type='button'
                onClick={() => onSelect(section.id)}
                aria-current={current === section.id ? 'page' : undefined}
                className='w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 aria-[current=page]:bg-zinc-200 aria-[current=page]:text-zinc-900'
              >
                {section.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
