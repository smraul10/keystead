import { z } from 'zod';

// The errors Rust sends (`CommandError` in src-tauri/src/error.rs): keep both
// in sync. Each kind is an object, so some can carry details (`version`)
const commandErrorSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('wrongPassword') }),
  z.object({ kind: z.literal('damagedFile') }),
  z.object({ kind: z.literal('newerVersion'), version: z.number().int() }),
  z.object({ kind: z.literal('notFound') }),
  z.object({ kind: z.literal('alreadyExists') }),
  z.object({ kind: z.literal('storage') }),
  z.object({ kind: z.literal('internal') }),
]);

export type CommandError = z.infer<typeof commandErrorSchema>;

/** Thrown by every command wrapper: `error` says what went wrong. */
export class CommandFailedError extends Error {
  readonly error: CommandError;

  constructor(error: CommandError) {
    super(`Command failed: ${error.kind}`);
    this.name = 'CommandFailedError';
    this.error = error;
  }
}

/**
 * What Rust rejected a command with, checked like any data from outside.
 * Anything unexpected (a typo in Rust, a missing permission, a crash) is an
 * internal error.
 */
export function toCommandError(error: unknown): CommandError {
  const parsed = commandErrorSchema.safeParse(error);
  return parsed.success ? parsed.data : { kind: 'internal' };
}

/** What the UI shows for each error. */
export function errorMessage(error: CommandError): string {
  // A switch over every kind: TypeScript fails if one is missing
  switch (error.kind) {
    case 'wrongPassword':
      return 'Wrong master password';
    case 'damagedFile':
      return "The vault file is damaged and can't be opened";
    case 'newerVersion':
      return `This vault was saved by a newer version of Keystead (format ${error.version}). Update Keystead to open it`;
    case 'notFound':
      return 'No vault was found';
    case 'alreadyExists':
      return 'A vault already exists';
    case 'storage':
      return "The vault couldn't be read or saved. Check the disk and its permissions";
    case 'internal':
      return 'Something unexpected went wrong';
  }
}
