import { mockIPC } from '@tauri-apps/api/mocks';
import { describe, expect, it } from 'vitest';
import {
  createVault,
  getVaultItems,
  getVaultStatus,
  lockVault,
  saveVault,
  unlockVault,
} from './commands';
import { CommandFailedError } from './errors';
import type { Item } from './item';

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
};

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

describe('unlockVault', () => {
  it('sends the master password to Rust', async () => {
    let received: unknown;
    mockIPC((command, args) => {
      if (command === 'unlock_vault') {
        received = args;
        return null;
      }
    });

    await unlockVault('correct horse battery staple');

    expect(received).toEqual({
      masterPassword: 'correct horse battery staple',
    });
  });

  it('fails with a wrong master password', async () => {
    mockIPC(() => Promise.reject({ kind: 'wrongPassword' }));

    await expect(unlockVault('wrong')).rejects.toMatchObject({
      error: { kind: 'wrongPassword' },
    });
  });
});

describe('getVaultItems', () => {
  it('gives the items of the unlocked vault', async () => {
    mockIPC((command) => (command === 'vault_items' ? [GITHUB] : undefined));

    await expect(getVaultItems()).resolves.toEqual([GITHUB]);
  });

  it('rejects an item it does not expect', async () => {
    // E.g. a field renamed in Rust but not here
    mockIPC(() => [{ id: '1', name: 'GitHub' }]);

    await expect(getVaultItems()).rejects.toMatchObject({
      error: { kind: 'internal' },
    });
  });
});

describe('saveVault', () => {
  it('sends every item to Rust', async () => {
    let received: unknown;
    mockIPC((command, args) => {
      if (command === 'save_vault') {
        received = args;
        return null;
      }
    });

    await saveVault([GITHUB]);

    expect(received).toEqual({ items: [GITHUB] });
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
