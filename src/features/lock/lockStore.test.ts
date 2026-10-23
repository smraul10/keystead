import { mockIPC } from '@tauri-apps/api/mocks';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEMO_MASTER_PASSWORD, useLockStore } from './lockStore';

describe('lockStore', () => {
  // The store lives outside React and survives between tests: reset it
  beforeEach(() => {
    useLockStore.setState(useLockStore.getInitialState());
  });

  it('waits for Rust before showing anything', () => {
    expect(useLockStore.getInitialState().status).toBe('checking');
  });

  it('asks Rust whether there is a vault', async () => {
    mockIPC((command) =>
      command === 'vault_status' ? 'notCreated' : undefined,
    );

    await useLockStore.getState().checkStatus();

    expect(useLockStore.getState().status).toBe('notCreated');
  });

  it('opens the vault it creates', async () => {
    // Arrange
    useLockStore.setState({ status: 'notCreated' });
    mockIPC(() => null);

    // Act
    await useLockStore.getState().createVault('correct horse battery staple');

    // Assert
    expect(useLockStore.getState().status).toBe('unlocked');
  });

  it('stays without a vault if creating it fails', async () => {
    // Arrange
    useLockStore.setState({ status: 'notCreated' });
    mockIPC(() => Promise.reject({ kind: 'storage' }));

    // Act
    const creating = useLockStore
      .getState()
      .createVault('correct horse battery staple');

    // Assert: the caller gets the error, to show it
    await expect(creating).rejects.toMatchObject({
      error: { kind: 'storage' },
    });
    expect(useLockStore.getState().status).toBe('notCreated');
  });

  it('unlocks with the right master password', async () => {
    useLockStore.setState({ status: 'locked' });

    const unlocked = await useLockStore.getState().unlock(DEMO_MASTER_PASSWORD);

    expect(unlocked).toBe(true);
    expect(useLockStore.getState().status).toBe('unlocked');
  });

  it('stays locked with a wrong master password', async () => {
    useLockStore.setState({ status: 'locked' });

    const unlocked = await useLockStore.getState().unlock('wrong');

    expect(unlocked).toBe(false);
    expect(useLockStore.getState().status).toBe('locked');
  });

  it('hides the vault at once and asks Rust to lock it', async () => {
    // Arrange
    useLockStore.setState({ status: 'unlocked' });
    const commands: string[] = [];
    mockIPC((command) => {
      commands.push(command);
      return null;
    });

    // Act
    const locking = useLockStore.getState().lock();

    // Assert: the UI doesn't wait for Rust to hide the vault
    expect(useLockStore.getState().status).toBe('locked');
    await locking;
    expect(commands).toEqual(['lock_vault']);
  });
});
