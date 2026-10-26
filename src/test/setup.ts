import '@testing-library/jest-dom/vitest';
import { clearMocks } from '@tauri-apps/api/mocks';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { useClipboardStore } from '@/features/clipboard';

// jsdom (v30) doesn't implement <dialog> yet: a minimal stand-in, only for
// tests, so components that call showModal() and close() can be tested.
// The app runs in WebView2 (Chromium), which has the real one.
if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

// jsdom doesn't implement matchMedia either: a stand-in where Windows is in
// light mode and never changes (a test that needs otherwise replaces it)
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  });
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  // Forget the fake Rust answers of mockIPC, so no test sees another's
  clearMocks();
  // A copy starts a countdown timer: stop it, so it doesn't outlive the test
  useClipboardStore.getState().stopCountdown();
});
