import { mockIPC } from '@tauri-apps/api/mocks';
import { describe, expect, it } from 'vitest';
import { getVaultStatus } from './commands';
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
