interface SaveQueueOptions<T> {
  save: (value: T) => Promise<void>;
  onSuccess: () => void;
  onFailure: (error: unknown) => void;
}

export interface SaveQueue<T> {
  // Saves `value` as soon as the save running now, if any, ends
  save: (value: T) => void;
  // Resolves when every value given so far has been saved (or has failed)
  flush: () => Promise<void>;
}

/**
 * Saves one value at a time, always the latest one: a value given while a
 * save is running waits, and replaces any other value still waiting. So an
 * older value never reaches the disk after a newer one, and changes made
 * quickly in a row are saved together.
 */
export function createSaveQueue<T>({
  save,
  onSuccess,
  onFailure,
}: SaveQueueOptions<T>): SaveQueue<T> {
  // In a box, so "no value waiting" can't be confused with a falsy value
  let waiting: { value: T } | null = null;
  let running: Promise<void> | null = null;

  async function saveWhileWaiting() {
    while (waiting) {
      const { value } = waiting;
      waiting = null;
      try {
        await save(value);
        onSuccess();
      } catch (error) {
        onFailure(error);
      }
    }
    running = null;
  }

  return {
    save: (value) => {
      waiting = { value };
      running ??= saveWhileWaiting();
    },
    flush: () => running ?? Promise.resolve(),
  };
}
