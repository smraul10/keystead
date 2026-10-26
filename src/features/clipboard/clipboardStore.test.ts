import { mockIPC } from '@tauri-apps/api/mocks';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useClipboardStore } from './clipboardStore';

const SECOND = 1000;

describe('clipboardStore', () => {
  // Fake clock and timers: thirty seconds pass in a moment
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('has nothing to count down at first', () => {
    expect(useClipboardStore.getInitialState().countdown).toBeNull();
  });

  it('counts down the time Rust gives', () => {
    useClipboardStore.getState().startCountdown(30);

    vi.advanceTimersByTime(10 * SECOND);

    expect(useClipboardStore.getState().countdown).toEqual({
      totalMs: 30 * SECOND,
      remainingMs: 20 * SECOND,
    });
  });

  it('stops when the time is up', () => {
    useClipboardStore.getState().startCountdown(30);

    vi.advanceTimersByTime(30 * SECOND);

    expect(useClipboardStore.getState().countdown).toBeNull();
  });

  it('starts again with every new copy', () => {
    // Arrange
    useClipboardStore.getState().startCountdown(30);
    vi.advanceTimersByTime(20 * SECOND);

    // Act: another copy, then 20 more seconds
    useClipboardStore.getState().startCountdown(30);
    vi.advanceTimersByTime(20 * SECOND);

    // Assert: 10 seconds left of the new copy
    expect(useClipboardStore.getState().countdown?.remainingMs).toBe(
      10 * SECOND,
    );
  });

  it('asks Rust to wipe the copy now', async () => {
    // Arrange
    const commands: string[] = [];
    mockIPC((command) => {
      commands.push(command);
      return null;
    });
    useClipboardStore.getState().startCountdown(30);

    // Act
    await useClipboardStore.getState().clearNow();

    // Assert
    expect(commands).toEqual(['clear_clipboard']);
    expect(useClipboardStore.getState().countdown).toBeNull();
  });
});
