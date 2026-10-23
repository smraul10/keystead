import { z } from 'zod';
import type { Item } from './item';

// Rules for the item form. Only the title is required: an item can be just a
// note, or a username without a password (like Bitwarden and KeePassXC).
// The password and notes are never trimmed: spaces may be part of them.
export const itemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Enter a title')
    .max(200, 'Use 200 characters or fewer'),
  username: z.string().trim().max(200, 'Use 200 characters or fewer'),
  password: z.string().max(1000, 'Use 1000 characters or fewer'),
  // Free text: people often type "github.com" without "https://"
  url: z.string().trim().max(2000, 'Use 2000 characters or fewer'),
  notes: z.string().max(10000, 'Use 10000 characters or fewer'),
  favorite: z.boolean(),
  // Not typed: downloaded from the website, or removed (see ItemForm)
  icon: z.base64().nullable(),
});

export type ItemFormValues = z.infer<typeof itemSchema>;

// What the form shows when creating a new item
export const EMPTY_ITEM_VALUES: ItemFormValues = {
  title: '',
  username: '',
  password: '',
  url: '',
  notes: '',
  favorite: false,
  icon: null,
};

// What the form shows when editing an item: only the fields the user can change
export function toFormValues(item: Item): ItemFormValues {
  return {
    title: item.title,
    username: item.username,
    password: item.password,
    url: item.url,
    notes: item.notes,
    favorite: item.favorite,
    icon: item.icon,
  };
}
