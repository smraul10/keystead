import { mockIPC } from '@tauri-apps/api/mocks';

export interface FakeClipboard {
  text: string | null;
}

/**
 * Stands in for Rust's clipboard (`copy_to_clipboard`): the returned object
 * holds what the UI copied, so a test can check it.
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
      return null;
    }
  });
  return clipboard;
}
