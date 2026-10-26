import { create } from 'zustand';
import { clearClipboard } from '@/api';

// How often the countdown moves: often enough for a smooth bar
const TICK_MS = 250;

interface Countdown {
  totalMs: number;
  remainingMs: number;
}

interface ClipboardState {
  // Time left until Rust wipes the last copy; null when there is none
  countdown: Countdown | null;
  // After each copy, with the seconds Rust gives
  startCountdown: (seconds: number) => void;
  stopCountdown: () => void;
  // "Clear now": Rust wipes the copy without waiting
  clearNow: () => Promise<void>;
}

export const useClipboardStore = create<ClipboardState>()((set, get) => {
  let timer: ReturnType<typeof setInterval> | undefined;

  return {
    countdown: null,
    startCountdown: (seconds) => {
      const totalMs = seconds * 1000;
      const clearsAt = Date.now() + totalMs;
      // A new copy replaces the old one, and its countdown
      clearInterval(timer);
      set({ countdown: { totalMs, remainingMs: totalMs } });
      // Compared with the clock, like the auto-lock: a slowed-down timer
      // still ends on time
      timer = setInterval(() => {
        const remainingMs = clearsAt - Date.now();
        if (remainingMs <= 0) {
          get().stopCountdown();
        } else {
          set({ countdown: { totalMs, remainingMs } });
        }
      }, TICK_MS);
    },
    stopCountdown: () => {
      clearInterval(timer);
      set({ countdown: null });
    },
    clearNow: async () => {
      await clearClipboard();
      get().stopCountdown();
    },
  };
});
