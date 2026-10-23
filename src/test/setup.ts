import '@testing-library/jest-dom/vitest';
import { clearMocks } from '@tauri-apps/api/mocks';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

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

afterEach(() => {
  cleanup();
  localStorage.clear();
  // Forget the fake Rust answers of mockIPC, so no test sees another's
  clearMocks();
});
