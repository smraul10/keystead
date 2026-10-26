import { mockIPC } from '@tauri-apps/api/mocks';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { fakeClipboard } from '@/test/fakeClipboard';
import { CopyButton } from './CopyButton';

describe('CopyButton', () => {
  it('copies the text when clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const clipboard = fakeClipboard();
    render(<CopyButton text='raul-dev' label='Copy username' />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Copy username' }));

    // Assert
    expect(clipboard.text).toBe('raul-dev');
  });

  it('confirms the copy', async () => {
    // Arrange
    const user = userEvent.setup();
    fakeClipboard();
    render(<CopyButton text='raul-dev' label='Copy username' />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Copy username' }));

    // Assert
    expect(
      await screen.findByRole('button', { name: 'Copied' }),
    ).toBeInTheDocument();
  });

  it('says when it could not copy', async () => {
    // Arrange: another app is holding the clipboard
    const user = userEvent.setup();
    mockIPC(() => Promise.reject({ kind: 'clipboard' }));
    render(<CopyButton text='raul-dev' label='Copy username' />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Copy username' }));

    // Assert
    expect(
      await screen.findByRole('button', { name: "Couldn't copy" }),
    ).toBeInTheDocument();
  });
});
