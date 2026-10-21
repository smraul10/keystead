import { useState } from 'react';
import { PasswordGenerator } from '@/features/generator';
import { ItemsView } from '@/features/items';
import { Sidebar, type Section } from './Sidebar';

export function App() {
  const [section, setSection] = useState<Section>('all');

  return (
    <div className='flex h-screen bg-white text-zinc-900'>
      <Sidebar current={section} onSelect={setSection} />
      <main className='flex-1 overflow-y-auto'>
        {section === 'all' ? (
          <ItemsView />
        ) : (
          <div className='flex flex-col gap-6 p-8'>
            <h1 className='text-2xl font-bold'>Generator</h1>
            <PasswordGenerator />
          </div>
        )}
      </main>
    </div>
  );
}
