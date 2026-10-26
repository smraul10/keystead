import { type ReactElement, useState } from 'react';
import { ClipboardStatusBar } from '@/features/clipboard';
import { PasswordGenerator } from '@/features/generator';
import { ItemsView, SaveErrorBanner } from '@/features/items';
import { useAutoLock, useLockStore } from '@/features/lock';
import {
  SettingsView,
  useSettingsStore,
  useShortcut,
} from '@/features/settings';
import { Sidebar, type Section } from './Sidebar';

interface SectionContentProps {
  section: Section;
}

// What each section shows. A switch over every section: TypeScript fails if
// one is missing
function SectionContent({ section }: SectionContentProps): ReactElement {
  switch (section) {
    case 'all':
    case 'favorites':
    case 'trash':
      // A new key per section: switching views clears selection and search
      return <ItemsView key={section} filter={section} />;
    case 'generator':
      return (
        <div className='flex flex-col gap-6 p-8'>
          <h1 className='text-2xl font-bold'>Generator</h1>
          <PasswordGenerator />
        </div>
      );
    case 'settings':
      return <SettingsView />;
  }
}

// The unlocked app: sidebar and the current section, between the notice
// shown if the last changes couldn't be saved and the clipboard's status bar
export function MainScreen() {
  const lock = useLockStore((state) => state.lock);
  const autoLockMinutes = useSettingsStore((state) => state.autoLockMinutes);
  const [section, setSection] = useState<Section>('all');
  // Only while the vault is open: locking unmounts MainScreen, and this stops
  useAutoLock(lock, autoLockMinutes * 60 * 1000);
  useShortcut('lock', () => void lock(), { whileTyping: true });

  return (
    <div className='flex h-screen flex-col bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100'>
      <SaveErrorBanner />
      <div className='flex min-h-0 flex-1'>
        <Sidebar current={section} onSelect={setSection} onLock={lock} />
        <main className='flex-1 overflow-y-auto'>
          <SectionContent section={section} />
        </main>
      </div>
      <ClipboardStatusBar />
    </div>
  );
}
