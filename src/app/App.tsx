import { useEffect, useState, type ReactElement } from 'react';
import { type CommandError, commandErrorOf } from '@/api';
import { CreateVaultScreen, UnlockScreen, useLockStore } from '@/features/lock';
import { MainScreen } from './MainScreen';
import { StartupError } from './StartupError';

export function App(): ReactElement | null {
  const status = useLockStore((state) => state.status);
  const checkStatus = useLockStore((state) => state.checkStatus);
  const [startupError, setStartupError] = useState<CommandError | null>(null);

  // At launch, ask Rust whether there is a vault to create or to unlock
  useEffect(() => {
    checkStatus().catch((error: unknown) => {
      setStartupError(commandErrorOf(error));
    });
  }, [checkStatus]);

  if (startupError) {
    return <StartupError error={startupError} />;
  }

  // A switch over every status: TypeScript fails if one is missing
  switch (status) {
    case 'checking':
      // Rust answers in a moment: show nothing until then
      return null;
    case 'notCreated':
      return <CreateVaultScreen />;
    case 'locked':
      return <UnlockScreen />;
    case 'unlocked':
      // Locking unmounts the whole MainScreen: the open section, the
      // selection, the search and any unsaved form are discarded, and
      // nothing stays rendered
      return <MainScreen />;
  }
}
