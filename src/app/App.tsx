import { UnlockScreen, useLockStore } from '@/features/lock';
import { MainScreen } from './MainScreen';

export function App() {
  const locked = useLockStore((state) => state.locked);

  // Locking unmounts the whole MainScreen: the open section, the selection,
  // the search and any unsaved form are discarded, and nothing stays rendered
  return locked ? <UnlockScreen /> : <MainScreen />;
}
