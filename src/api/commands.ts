import { invoke, type InvokeArgs } from '@tauri-apps/api/core';
import { z } from 'zod';
import { CommandFailedError, toCommandError } from './errors';
import { itemSchema, type Item } from './item';

/**
 * Calls a Rust command and validates its answer with `schema`: what comes
 * from Rust is data from outside, so it is checked instead of trusted.
 * Every failure becomes a `CommandFailedError` with a typed error.
 */
async function call<T>(
  command: string,
  schema: z.ZodType<T>,
  args?: InvokeArgs,
): Promise<T> {
  let answer: unknown;
  try {
    answer = await invoke(command, args);
  } catch (error) {
    throw new CommandFailedError(toCommandError(error));
  }

  const parsed = schema.safeParse(answer);
  if (!parsed.success) {
    throw new CommandFailedError({ kind: 'internal' });
  }
  return parsed.data;
}

// `VaultStatus` in src-tauri/src/state.rs: keep both in sync
const vaultStatusSchema = z.enum(['notCreated', 'locked', 'unlocked']);

export type VaultStatus = z.infer<typeof vaultStatusSchema>;

/** Whether there is a vault to create, to unlock, or an unlocked one. */
export function getVaultStatus(): Promise<VaultStatus> {
  return call('vault_status', vaultStatusSchema);
}

// Commands that answer nothing: Rust's `()` arrives as `null`
const nothingSchema = z.null();

/** Creates the vault with this master password and leaves it unlocked. */
export async function createVault(masterPassword: string): Promise<void> {
  await call('create_vault', nothingSchema, { masterPassword });
}

/** Opens the vault with this master password and keeps it unlocked. */
export async function unlockVault(masterPassword: string): Promise<void> {
  await call('unlock_vault', nothingSchema, { masterPassword });
}

/** The items in the unlocked vault. */
export function getVaultItems(): Promise<Item[]> {
  return call('vault_items', z.array(itemSchema));
}

/** Locks the vault: Rust wipes its key and its items from memory. */
export async function lockVault(): Promise<void> {
  await call('lock_vault', nothingSchema);
}
