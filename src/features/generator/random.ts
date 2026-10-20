function randomUint32(): number {
  const [value] = crypto.getRandomValues(new Uint32Array(1));
  if (value === undefined) {
    throw new Error('Could not generate a random number');
  }
  return value;
}

export function randomIndex(max: number): number {
  // Largest multiple of max that fits in a Uint32: values above it are unfair
  const range = 2 ** 32;
  const limit = range - (range % max);

  let value = randomUint32();
  while (value >= limit) {
    value = randomUint32(); // re-roll while the value falls in the unfair zone
  }
  return value % max;
}

// Fisher-Yates shuffle with cryptographic randomness
export function shuffle(chars: string): string {
  const array = chars.split('');
  for (let i = array.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1); // a random position between 0 and i (both included)
    const current = array[i];
    const other = array[j];
    if (current === undefined || other === undefined) {
      throw new Error('Shuffle index out of range'); // cannot happen: 0 <= j <= i < length
    }
    array[i] = other; // swap the two positions
    array[j] = current;
  }
  return array.join('');
}
