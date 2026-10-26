import { emit } from '@tauri-apps/api/event';
import { mockIPC } from '@tauri-apps/api/mocks';
import { describe, expect, it, vi } from 'vitest';
import { onLockRequested } from './events';

describe('onLockRequested', () => {
  it('calls back when Rust asks to lock', async () => {
    // Arrange: the fake Rust also passes events along
    mockIPC(() => null, { shouldMockEvents: true });
    const onLock = vi.fn();
    await onLockRequested(onLock);

    // Act: what Rust sends when Windows locks the session
    await emit('lock-requested');

    // Assert
    expect(onLock).toHaveBeenCalledOnce();
  });

  it('stops listening when told to', async () => {
    mockIPC(() => null, { shouldMockEvents: true });
    const onLock = vi.fn();
    const stop = await onLockRequested(onLock);

    stop();
    await emit('lock-requested');

    expect(onLock).not.toHaveBeenCalled();
  });
});
