import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { fakeClipboard } from '@/test/fakeClipboard';
import { ClipboardStatusBar } from './ClipboardStatusBar';
import { useClipboardStore } from './clipboardStore';

describe('ClipboardStatusBar', () => {
  it('shows nothing while there is no copy to wipe', () => {
    render(<ClipboardStatusBar />);

    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
  });

  it('shows how long until the copy is wiped', () => {
    // 26.4 s left: shown as 27, so it never says 0 while there is time left
    useClipboardStore.setState({
      countdown: { totalMs: 30_000, remainingMs: 26_400 },
    });

    render(<ClipboardStatusBar />);

    expect(screen.getByRole('timer')).toHaveTextContent(
      'Copied · clears in 27 s',
    );
  });

  it('wipes the copy now', async () => {
    // Arrange
    const user = userEvent.setup();
    const clipboard = fakeClipboard();
    clipboard.text = 'secret';
    useClipboardStore.setState({
      countdown: { totalMs: 30_000, remainingMs: 26_400 },
    });
    render(<ClipboardStatusBar />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Clear now' }));

    // Assert
    expect(clipboard.text).toBeNull();
    await waitFor(() =>
      expect(screen.queryByRole('timer')).not.toBeInTheDocument(),
    );
  });
});
