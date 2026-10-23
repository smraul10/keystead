import { describe, expect, it, vi } from 'vitest';
import { createSaveQueue } from './saveQueue';

interface Call {
  value: string;
  finish: () => void;
  fail: (error: unknown) => void;
}

// A save that only ends when the test says so, like a slow disk
function slowSave() {
  const calls: Call[] = [];
  const save = (value: string) =>
    new Promise<void>((resolve, reject) => {
      calls.push({ value, finish: resolve, fail: reject });
    });
  return { save, calls };
}

describe('createSaveQueue', () => {
  it('saves a value', async () => {
    const saved: string[] = [];
    const queue = createSaveQueue({
      save: (value: string) => {
        saved.push(value);
        return Promise.resolve();
      },
      onSuccess: vi.fn(),
      onFailure: vi.fn(),
    });

    queue.save('a');
    await queue.flush();

    expect(saved).toEqual(['a']);
  });

  it('saves one value at a time, and only the latest of those waiting', async () => {
    // Arrange
    const { save, calls } = slowSave();
    const queue = createSaveQueue({
      save,
      onSuccess: vi.fn(),
      onFailure: vi.fn(),
    });

    // Act: three changes while the first one is being saved
    queue.save('a');
    queue.save('b');
    queue.save('c');

    // Assert: 'b' waited, and 'c' replaced it
    expect(calls.map((call) => call.value)).toEqual(['a']);
    calls[0]?.finish();
    await vi.waitFor(() =>
      expect(calls.map((call) => call.value)).toEqual(['a', 'c']),
    );
    calls[1]?.finish();
    await queue.flush();
    expect(calls).toHaveLength(2);
  });

  it('reports each failure and each success', async () => {
    // Arrange
    const { save, calls } = slowSave();
    const onSuccess = vi.fn();
    const onFailure = vi.fn();
    const queue = createSaveQueue({ save, onSuccess, onFailure });

    // Act + Assert: a failure doesn't stop the next save
    queue.save('a');
    calls[0]?.fail('disk full');
    await queue.flush();
    expect(onFailure).toHaveBeenCalledWith('disk full');

    queue.save('b');
    calls[1]?.finish();
    await queue.flush();
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it('flushes the values given while saving too', async () => {
    // Arrange
    const { save, calls } = slowSave();
    const queue = createSaveQueue({
      save,
      onSuccess: vi.fn(),
      onFailure: vi.fn(),
    });
    let flushed = false;

    // Act
    queue.save('a');
    void queue.flush().then(() => {
      flushed = true;
    });
    queue.save('b');
    calls[0]?.finish();
    await vi.waitFor(() => expect(calls).toHaveLength(2));

    // Assert: still waiting for 'b'
    expect(flushed).toBe(false);
    calls[1]?.finish();
    await vi.waitFor(() => expect(flushed).toBe(true));
  });

  it('flushes at once when there is nothing to save', async () => {
    const queue = createSaveQueue({
      save: () => Promise.resolve(),
      onSuccess: vi.fn(),
      onFailure: vi.fn(),
    });

    await expect(queue.flush()).resolves.toBeUndefined();
  });
});
