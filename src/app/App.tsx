import { useState } from 'react';
import { PasswordGenerator } from '@/features/generator';
import { Sidebar, type Section } from './Sidebar';

export function App() {
  const [section, setSection] = useState<Section>('all');

  return (
    <div className='flex h-screen bg-white text-zinc-900'>
      <Sidebar current={section} onSelect={setSection} />
      <main className='flex flex-1 flex-col gap-6 overflow-y-auto p-8'>
        {section === 'all' ? (
          <>
            <h1 className='text-2xl font-bold'>All items</h1>
            <p className='text-zinc-500'>No items yet</p>
          </>
        ) : (
          <>
            <h1 className='text-2xl font-bold'>Generator</h1>
            <PasswordGenerator />
          </>
        )}
      </main>
    </div>
  );
}
