import { mockIPC } from '@tauri-apps/api/mocks';
import { describe, expect, it } from 'vitest';
import { createVault, getVaultStatus, lockVault } from './commands';
import { CommandFailedError } from './errors';

describe('getVaultStatus', () => {
  it('asks Rust for the vault status', async () => {
    // mockIPC stands in for Rust: it answers each command the UI invokes
    mockIPC((command) => (command === 'vault_status' ? 'locked' : undefined));

    await expect(getVaultStatus()).resolves.toBe('locked');
  });

  it('turns an error from Rust into a typed error', async () => {
    mockIPC(() => Promise.reject({ kind: 'storage' }));

    const failure = getVaultStatus();

    await expect(failure).rejects.toBeInstanceOf(CommandFailedError);
    await expect(failure).rejects.toMatchObject({
      error: { kind: 'storage' },
    });
  });

  it('rejects an answer it does not expect', async () => {
    // Data from Rust is validated like any data from outside
    mockIPC(() => 'maybe');

    await expect(getVaultStatus()).rejects.toMatchObject({
      error: { kind: 'internal' },
    });
  });
});

describe('createVault', () => {
  it('sends the master password to Rust', async () => {
    // Arrange: remember what the UI sends
    let received: unknown;
    mockIPC((command, args) => {
      if (command === 'create_vault') {
        received = args;
        return null;
      }
    });

    // Act
    await createVault('correct horse battery staple');

    // Assert: Rust's `master_password` is `masterPassword` in JavaScript
    expect(received).toEqual({
      masterPassword: 'correct horse battery staple',
    });
  });

  it('fails if there is a vault already', async () => {
    mockIPC(() => Promise.reject({ kind: 'alreadyExists' }));

    await expect(
      createVault('correct horse battery staple'),
    ).rejects.toMatchObject({ error: { kind: 'alreadyExists' } });
  });
});

describe('lockVault', () => {
  it('asks Rust to lock the vault', async () => {
    const commands: string[] = [];
    mockIPC((command) => {
      commands.push(command);
      return null;
    });

    await lockVault();

    expect(commands).toEqual(['lock_vault']);
  });
});
