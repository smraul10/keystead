export const AVATAR_COLORS = [
  'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  'bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300',
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
