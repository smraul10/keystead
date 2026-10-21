import { act, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCopyToClipboard } from './useCopyToClipboard';

describe('useCopyToClipboard', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('copies the text to the clipboard', async () => {
    // Arrange: userEvent installs a fake clipboard in the test browser
    userEvent.setup();
    const { result } = renderHook(() => useCopyToClipboard());

    // Act
    await act(() => result.current.copy('secret'));

    // Assert
    expect(await navigator.clipboard.readText()).toBe('secret');
    expect(result.current.copied).toBe(true);
  });

  it('keeps the confirmation for 2 seconds', async () => {
    // Arrange: fake timers let the test move the clock forward
    userEvent.setup();
    vi.useFakeTimers();
    const { result } = renderHook(() => useCopyToClipboard());
    await act(() => result.current.copy('secret'));

    // Act + Assert: still copied 1 ms before the limit, reset at the limit
    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(result.current.copied).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.copied).toBe(false);
  });

  it('resets the confirmation on demand', async () => {
    // Arrange: copy something first, so there is a confirmation to reset
    userEvent.setup();
    const { result } = renderHook(() => useCopyToClipboard());
    await act(() => result.current.copy('secret'));

    // Act
    act(() => {
      result.current.reset();
    });

    // Assert
    expect(result.current.copied).toBe(false);
  });
});
