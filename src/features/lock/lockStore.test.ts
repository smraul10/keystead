import { mockIPC } from '@tauri-apps/api/mocks';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Item } from '@/api';
import { useItemsStore } from '@/features/items';
import { useLockStore } from './lockStore';

const PASSWORD = 'correct horse battery staple';

const GITHUB: Item = {
  id: '1',
  title: 'GitHub',
  username: 'raul-dev',
  password: 'b,YjHm4^9aBBNC[zP]GD',
  url: 'https://github.com',
  notes: '',
  favorite: true,
  createdAt: '2026-03-14T10:12:00.000Z',
  updatedAt: '2026-09-02T18:40:00.000Z',
  deletedAt: null,
  icon: null,
};

// What Rust answers to each command (any other one fails)
function rustAnswers(answers: Record<string, unknown>) {
  mockIPC((command) => answers[command]);
}

describe('lockStore', () => {
  // The stores live outside React and survive between tests: reset them
  beforeEach(() => {
    useLockStore.setState(useLockStore.getInitialState());
    useItemsStore.setState(useItemsStore.getInitialState());
  });

  it('waits for Rust before showing anything', () => {
    expect(useLockStore.getInitialState().status).toBe('checking');
  });

  it('asks Rust whether there is a vault', async () => {
    rustAnswers({ vault_status: 'notCreated' });

    await useLockStore.getState().checkStatus();

    expect(useLockStore.getState().status).toBe('notCreated');
  });

  it('shows the items of a vault that is still open in Rust', async () => {
    // Arrange: the window was reloaded while the vault was unlocked
    rustAnswers({ vault_status: 'unlocked', vault_items: [GITHUB] });

    // Act
    await useLockStore.getState().checkStatus();

    // Assert
    expect(useLockStore.getState().status).toBe('unlocked');
    expect(useItemsStore.getState().items).toEqual([GITHUB]);
  });

  it('opens the vault it creates', async () => {
    // Arrange
    useLockStore.setState({ status: 'notCreated' });
    rustAnswers({ create_vault: null, vault_items: [] });

    // Act
    await useLockStore.getState().createVault(PASSWORD);

    // Assert
    expect(useLockStore.getState().status).toBe('unlocked');
  });

  it('stays without a vault if creating it fails', async () => {
    // Arrange
    useLockStore.setState({ status: 'notCreated' });
    mockIPC(() => Promise.reject({ kind: 'storage' }));

    // Act
    const creating = useLockStore.getState().createVault(PASSWORD);

    // Assert: the caller gets the error, to show it
    await expect(creating).rejects.toMatchObject({
      error: { kind: 'storage' },
    });
    expect(useLockStore.getState().status).toBe('notCreated');
  });

  it('unlocks the vault and loads its items', async () => {
    // Arrange
    useLockStore.setState({ status: 'locked' });
    rustAnswers({ unlock_vault: null, vault_items: [GITHUB] });

    // Act
    await useLockStore.getState().unlock(PASSWORD);

    // Assert
    expect(useLockStore.getState().status).toBe('unlocked');
    expect(useItemsStore.getState().items).toEqual([GITHUB]);
  });

  it('stays locked with a wrong master password', async () => {
    // Arrange
    useLockStore.setState({ status: 'locked' });
    mockIPC(() => Promise.reject({ kind: 'wrongPassword' }));

    // Act
    const unlocking = useLockStore.getState().unlock('wrong');

    // Assert
    await expect(unlocking).rejects.toMatchObject({
      error: { kind: 'wrongPassword' },
    });
    expect(useLockStore.getState().status).toBe('locked');
    expect(useItemsStore.getState().items).toEqual([]);
  });

  it('hides the vault and its items at once, and asks Rust to lock it', async () => {
    // Arrange
    useLockStore.setState({ status: 'unlocked' });
    useItemsStore.setState({ items: [GITHUB] });
    const commands: string[] = [];
    mockIPC((command) => {
      commands.push(command);
      return null;
    });

    // Act
    const locking = useLockStore.getState().lock();

    // Assert: the UI doesn't wait for Rust to forget the vault
    expect(useLockStore.getState().status).toBe('locked');
    expect(useItemsStore.getState().items).toEqual([]);
    await locking;
    expect(commands).toEqual(['lock_vault']);
  });

  it('saves the last changes before Rust locks the vault', async () => {
    // Arrange: a slow disk, and a change made just before locking
    useLockStore.setState({ status: 'unlocked' });
    useItemsStore.setState({ items: [GITHUB] });
    const commands: string[] = [];
    mockIPC(async (command) => {
      commands.push(command);
      if (command === 'save_vault') {
        await new Promise((resolve) => setTimeout(resolve, 10));
        commands.push('saved');
      }
      return null;
    });
    useItemsStore.getState().toggleFavorite('1');

    // Act
    await useLockStore.getState().lock();

    // Assert: locking waited for the save
    expect(commands).toEqual(['save_vault', 'saved', 'lock_vault']);
  });
});
