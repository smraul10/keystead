import { useState } from 'react';
import { PasswordGenerator } from '@/features/generator';
import { ItemsView } from '@/features/items';
import { useLockStore } from '@/features/lock';
import { Sidebar, type Section } from './Sidebar';

// The unlocked app: sidebar and the current section
export function MainScreen() {
  const lock = useLockStore((state) => state.lock);
  const [section, setSection] = useState<Section>('all');

  return (
    <div className='flex h-screen bg-white text-zinc-900'>
      <Sidebar current={section} onSelect={setSection} onLock={lock} />
      <main className='flex-1 overflow-y-auto'>
        {section === 'generator' ? (
          <div className='flex flex-col gap-6 p-8'>
            <h1 className='text-2xl font-bold'>Generator</h1>
            <PasswordGenerator />
          </div>
        ) : (
          // A new key per section: switching views clears selection and search
          <ItemsView key={section} filter={section} />
        )}
      </main>
    </div>
  );
}
