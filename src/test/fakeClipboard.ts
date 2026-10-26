import { mockIPC } from '@tauri-apps/api/mocks';

export interface FakeClipboard {
  text: string | null;
}

// Like Rust: a copy is wiped after 30 seconds
const CLEARS_AFTER_SECONDS = 30;

/**
 * Stands in for Rust's clipboard (`copy_to_clipboard`, `clear_clipboard`):
 * the returned object holds what the UI copied, so a test can check it.
 */
export function fakeClipboard(): FakeClipboard {
  const clipboard: FakeClipboard = { text: null };
  mockIPC((command, args) => {
    if (
      command === 'copy_to_clipboard' &&
      args &&
      'text' in args &&
      typeof args.text === 'string'
    ) {
      clipboard.text = args.text;
      return CLEARS_AFTER_SECONDS;
    }
    if (command === 'clear_clipboard') {
      clipboard.text = null;
      return null;
    }
  });
  return clipboard;
}
