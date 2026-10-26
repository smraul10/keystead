import { mockIPC } from '@tauri-apps/api/mocks';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeClipboard } from '@/test/fakeClipboard';
import { useClipboardStore } from './clipboardStore';
import { useCopyToClipboard } from './useCopyToClipboard';

describe('useCopyToClipboard', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('asks Rust to copy the text', async () => {
    // Arrange
    const clipboard = fakeClipboard();
    const { result } = renderHook(() => useCopyToClipboard());

    // Act
    await act(() => result.current.copy('secret'));

    // Assert
    expect(clipboard.text).toBe('secret');
    expect(result.current.copied).toBe(true);
  });

  it('starts the countdown until Rust wipes the copy', async () => {
    fakeClipboard();
    const { result } = renderHook(() => useCopyToClipboard());

    await act(() => result.current.copy('secret'));

    expect(useClipboardStore.getState().countdown?.totalMs).toBe(30 * 1000);
  });

  it('keeps the confirmation for 2 seconds', async () => {
    // Arrange: fake timers let the test move the clock forward
    fakeClipboard();
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
    fakeClipboard();
    const { result } = renderHook(() => useCopyToClipboard());
    await act(() => result.current.copy('secret'));

    // Act
    act(() => {
      result.current.reset();
    });

    // Assert
    expect(result.current.copied).toBe(false);
  });

  it('says when the text could not be copied', async () => {
    // Arrange: another app is holding the clipboard
    mockIPC(() => Promise.reject({ kind: 'clipboard' }));
    const { result } = renderHook(() => useCopyToClipboard());

    // Act
    await act(() => result.current.copy('secret'));

    // Assert
    expect(result.current.failed).toBe(true);
    expect(result.current.copied).toBe(false);
  });
});
