export type CharType = 'letter' | 'digit' | 'symbol';

export function getCharType(char: string): CharType {
  if (/[0-9]/.test(char)) return 'digit';
  if (/[a-zA-Z]/.test(char)) return 'letter';
  return 'symbol';
}
