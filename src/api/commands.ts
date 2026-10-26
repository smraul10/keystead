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

/** Replaces the items of the unlocked vault and saves it to its file. */
export async function saveVault(items: readonly Item[]): Promise<void> {
  await call('save_vault', nothingSchema, { items });
}

/**
 * Asks Rust to download the icon of the website at `url` (the only command
 * that uses the network): a PNG of at most 64×64 pixels, in base64.
 */
export function downloadIcon(url: string): Promise<string> {
  return call('download_icon', z.base64(), { url });
}

/**
 * Asks Rust to copy `text`: it keeps it out of the Windows clipboard history
 * and wipes it later, on lock and on exit. Returns the seconds until then.
 */
export function copyToClipboard(text: string): Promise<number> {
  return call('copy_to_clipboard', z.number().int().positive(), { text });
}

/** Asks Rust to wipe the last copy now, if the clipboard still holds it. */
export async function clearClipboard(): Promise<void> {
  await call('clear_clipboard', nothingSchema);
}

/** Locks the vault: Rust wipes its key and its items from memory. */
export async function lockVault(): Promise<void> {
  await call('lock_vault', nothingSchema);
}
