import { z } from 'zod';

// `Item` in src-tauri/crates/vault/src/model.rs: keep both in sync. The items
// Rust sends are checked against it, like any data from outside
export const itemSchema = z.object({
  id: z.string(),
  title: z.string(),
  username: z.string(),
  password: z.string(),
  url: z.string(),
  notes: z.string(),
  favorite: z.boolean(),
  // ISO 8601 dates in UTC, like `2026-10-22T10:00:00.000Z`
  createdAt: z.string(),
  updatedAt: z.string(),
  // When the item was moved to the trash; null if it is not in the trash
  deletedAt: z.string().nullable(),
  // The site's icon: a PNG of at most 64×64 pixels, in base64; null if none.
  // Anything else (e.g. an SVG with code) is rejected
  icon: z.base64().nullable(),
});

export type Item = z.infer<typeof itemSchema>;
