import { mockIPC } from '@tauri-apps/api/mocks';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useLockStore } from './lockStore';
import { UnlockScreen } from './UnlockScreen';

const PASSWORD = 'correct horse battery staple';

// A stand-in for Rust with an empty vault that only PASSWORD opens
function fakeRust() {
  mockIPC((command, args) => {
    switch (command) {
      case 'unlock_vault':
        return args &&
          'masterPassword' in args &&
          args.masterPassword === PASSWORD
          ? null
          : Promise.reject({ kind: 'wrongPassword' });
      case 'vault_items':
        return [];
    }
  });
}

describe('UnlockScreen', () => {
  beforeEach(() => {
    useLockStore.setState({ status: 'locked' });
  });

  it('asks for the master password', () => {
    render(<UnlockScreen />);

    expect(screen.getByLabelText('Master password')).toHaveFocus();
  });

  it('requires the master password', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<UnlockScreen />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Unlock' }));

    // Assert
    const field = screen.getByLabelText('Master password');
    await waitFor(() =>
      expect(field).toHaveAccessibleDescription('Enter your master password'),
    );
    expect(useLockStore.getState().status).toBe('locked');
  });

  it('rejects a wrong master password and keeps it selected', async () => {
    // Arrange
    const user = userEvent.setup();
    fakeRust();
    render(<UnlockScreen />);
    const field = screen.getByLabelText('Master password');

    // Act
    await user.type(field, 'wrong');
    await user.click(screen.getByRole('button', { name: 'Unlock' }));

    // Assert: still locked, with the error linked to the field
    await waitFor(() =>
      expect(field).toHaveAccessibleDescription('Wrong master password'),
    );
    expect(useLockStore.getState().status).toBe('locked');
    // Kept and selected: typing replaces it, or the eye shows the typo
    expect(field).toHaveValue('wrong');
    expect(field).toHaveFocus();
    expect(field).toHaveProperty('selectionStart', 0);
    expect(field).toHaveProperty('selectionEnd', 'wrong'.length);
  });

  it('explains why the vault could not be opened', async () => {
    // Arrange: the file isn't a vault anymore
    const user = userEvent.setup();
    mockIPC(() => Promise.reject({ kind: 'damagedFile' }));
    render(<UnlockScreen />);

    // Act
    await user.type(
      screen.getByLabelText('Master password'),
      `${PASSWORD}{Enter}`,
    );

    // Assert: not about the password, so not on its field
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The vault file is damaged',
    );
    expect(useLockStore.getState().status).toBe('locked');
  });

  it('unlocks with the right master password', async () => {
    // Arrange
    const user = userEvent.setup();
    fakeRust();
    render(<UnlockScreen />);

    // Act: Enter submits the form
    await user.type(
      screen.getByLabelText('Master password'),
      `${PASSWORD}{Enter}`,
    );

    // Assert
    await waitFor(() =>
      expect(useLockStore.getState().status).toBe('unlocked'),
    );
  });
});
