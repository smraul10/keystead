import { useEffect } from 'react';

// What counts as using the app
const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel'];

// How often the time without activity is checked
const CHECK_EVERY_MS = 5 * 1000;

/**
 * Calls `lock` once nobody has used the app for `idleMs`. It compares the
 * clock with the last activity instead of trusting a single long timer:
 * Windows slows down the timers of a minimized window, and the check must
 * still happen as soon as the window comes back.
 */
export function useAutoLock(lock: () => void, idleMs: number) {
  useEffect(() => {
    let lastActivity = Date.now();
    let locked = false;

    function lockIfIdle() {
      if (!locked && Date.now() - lastActivity >= idleMs) {
        locked = true;
        lock();
      }
    }

    function onActivity() {
      // Coming back after the limit locks: the mouse moving when the window
      // reappears must not count as using the app
      lockIfIdle();
      lastActivity = Date.now();
    }

    for (const type of ACTIVITY_EVENTS) {
      window.addEventListener(type, onActivity, { passive: true });
    }
    document.addEventListener('visibilitychange', lockIfIdle);
    const timer = setInterval(lockIfIdle, CHECK_EVERY_MS);

    return () => {
      for (const type of ACTIVITY_EVENTS) {
        window.removeEventListener(type, onActivity);
      }
      document.removeEventListener('visibilitychange', lockIfIdle);
      clearInterval(timer);
    };
  }, [lock, idleMs]);
}
