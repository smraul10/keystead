import { fireEvent, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAutoLock } from './useAutoLock';

const MINUTE = 60 * 1000;

describe('useAutoLock', () => {
  // Fake clock and timers: ten minutes pass in a moment
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('locks after the given time without activity', () => {
    const lock = vi.fn();
    renderHook(() => useAutoLock(lock, 10 * MINUTE));

    vi.advanceTimersByTime(10 * MINUTE);

    expect(lock).toHaveBeenCalledOnce();
  });

  it('does not lock before that time', () => {
    const lock = vi.fn();
    renderHook(() => useAutoLock(lock, 10 * MINUTE));

    vi.advanceTimersByTime(9 * MINUTE);

    expect(lock).not.toHaveBeenCalled();
  });

  it('starts counting again after any activity', () => {
    // Arrange
    const lock = vi.fn();
    renderHook(() => useAutoLock(lock, 10 * MINUTE));
    vi.advanceTimersByTime(9 * MINUTE);

    // Act: a key press, then almost ten more minutes
    fireEvent.keyDown(window);
    vi.advanceTimersByTime(9 * MINUTE);

    // Assert
    expect(lock).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1 * MINUTE);
    expect(lock).toHaveBeenCalledOnce();
  });

  it('locks instead of counting the activity of someone coming back too late', () => {
    // Arrange: Windows may slow down the timers of a minimized window, so
    // the clock moves on without the check running
    const lock = vi.fn();
    renderHook(() => useAutoLock(lock, 10 * MINUTE));
    vi.setSystemTime(Date.now() + 11 * MINUTE);

    // Act: the mouse moves when the window comes back
    fireEvent.pointerMove(window);

    // Assert
    expect(lock).toHaveBeenCalledOnce();
  });

  it('stops watching once the vault is closed', () => {
    const lock = vi.fn();
    const { unmount } = renderHook(() => useAutoLock(lock, 10 * MINUTE));

    unmount();
    vi.advanceTimersByTime(20 * MINUTE);

    expect(lock).not.toHaveBeenCalled();
  });
});
