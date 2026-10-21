export const AVATAR_COLORS = [
  'bg-rose-100 text-rose-700',
  'bg-orange-100 text-orange-700',
  'bg-amber-100 text-amber-800',
  'bg-lime-100 text-lime-800',
  'bg-emerald-100 text-emerald-700',
  'bg-cyan-100 text-cyan-800',
  'bg-sky-100 text-sky-700',
  'bg-indigo-100 text-indigo-700',
  'bg-violet-100 text-violet-700',
  'bg-fuchsia-100 text-fuchsia-700',
] as const;

export function getInitial(title: string): string {
  const first = Array.from(title.trim())[0];
  if (first === undefined) {
    return '?';
  }
  return first.toLocaleUpperCase();
}

export function getAvatarColor(title: string): string {
  let hash = 0;
  for (const char of title.toLocaleLowerCase()) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  }

  const color = AVATAR_COLORS[hash % AVATAR_COLORS.length];
  if (color === undefined) {
    throw new Error('Avatar color index out of range');
  }
  return color;
}
