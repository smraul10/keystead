import type { Item } from './item';

// Turns "Éxito" and "EXITO" into "exito", so searches ignore case and accents
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase();
}

// Passwords are never searched: results must not reveal anything about them
export function filterItems(items: readonly Item[], query: string): Item[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [...items];
  }

  return items.filter((item) => {
    const text = normalize(
      [item.title, item.username, item.url, item.notes].join(' '),
    );
    return words.every((word) => text.includes(word));
  });
}
