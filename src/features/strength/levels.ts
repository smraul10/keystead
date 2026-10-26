export type Strength = 'poor' | 'weak' | 'good' | 'excellent';

// Levels like KeePassXC's, for generated and typed passwords alike
export function getStrength(bits: number): Strength {
  if (bits < 40) return 'poor';
  if (bits < 75) return 'weak';
  if (bits < 100) return 'good';
  return 'excellent';
}
