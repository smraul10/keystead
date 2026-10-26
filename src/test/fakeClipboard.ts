import { mockIPC } from '@tauri-apps/api/mocks';

export interface FakeClipboard {
  text: string | null;
  // How long the UI asked Rust to keep the last copy
  clearAfterSeconds: number | null;
}

/**
 * Stands in for Rust's clipboard (`copy_to_clipboard`, `clear_clipboard`):
 * the returned object holds what the UI copied, so a test can check it.
 */
export function fakeClipboard(): FakeClipboard {
  const clipboard: FakeClipboard = { text: null, clearAfterSeconds: null };
  mockIPC((command, args) => {
    if (
      command === 'copy_to_clipboard' &&
      args &&
      'text' in args &&
      typeof args.text === 'string' &&
      'clearAfterSeconds' in args &&
      typeof args.clearAfterSeconds === 'number'
    ) {
      clipboard.text = args.text;
      clipboard.clearAfterSeconds = args.clearAfterSeconds;
      // Like Rust, it keeps the copy as long as asked
      return args.clearAfterSeconds;
    }
    if (command === 'clear_clipboard') {
      clipboard.text = null;
      return null;
    }
  });
  return clipboard;
}
