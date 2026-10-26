import { useState } from 'react';
import { ClipboardStatusBar } from '@/features/clipboard';
import { PasswordGenerator } from '@/features/generator';
import { ItemsView, SaveErrorBanner } from '@/features/items';
import { AUTO_LOCK_AFTER_MS, useAutoLock, useLockStore } from '@/features/lock';
import { Sidebar, type Section } from './Sidebar';

// The unlocked app: sidebar and the current section, between the notice
// shown if the last changes couldn't be saved and the clipboard's status bar
export function MainScreen() {
  const lock = useLockStore((state) => state.lock);
  const [section, setSection] = useState<Section>('all');
  // Only while the vault is open: locking unmounts MainScreen, and this stops
  useAutoLock(lock, AUTO_LOCK_AFTER_MS);

  return (
    <div className='flex h-screen flex-col bg-white text-zinc-900'>
      <SaveErrorBanner />
      <div className='flex min-h-0 flex-1'>
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
      <ClipboardStatusBar />
    </div>
  );
}
