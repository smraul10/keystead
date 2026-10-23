import { mockIPC } from '@tauri-apps/api/mocks';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateVaultScreen } from './CreateVaultScreen';
import { useLockStore } from './lockStore';

const PASSWORD = 'correct horse battery staple';

// Types both fields and submits the form
async function createVault(
  user: UserEvent,
  password: string,
  confirmation = password,
) {
  await user.type(screen.getByLabelText('Master password'), password);
  await user.type(
    screen.getByLabelText('Confirm master password'),
    confirmation,
  );
  await user.click(screen.getByRole('button', { name: 'Create vault' }));
}

describe('CreateVaultScreen', () => {
  beforeEach(() => {
    useLockStore.setState({ status: 'notCreated' });
  });

  it('asks for a master password of at least 12 characters', () => {
    render(<CreateVaultScreen />);

    const field = screen.getByLabelText('Master password');
    expect(field).toHaveFocus();
    expect(field).toHaveAccessibleDescription('At least 12 characters');
  });

  it('warns that a forgotten master password cannot be recovered', () => {
    render(<CreateVaultScreen />);

    expect(
      screen.getByText(/nobody can recover your vault/),
    ).toBeInTheDocument();
  });

  it('rejects a master password shorter than 12 characters', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<CreateVaultScreen />);

    // Act: 11 characters
    await createVault(user, 'elevenchars');

    // Assert
    await waitFor(() =>
      expect(
        screen.getByLabelText('Master password'),
      ).toHaveAccessibleDescription('Use at least 12 characters'),
    );
    expect(useLockStore.getState().status).toBe('notCreated');
  });

  it('requires the confirmation to match', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<CreateVaultScreen />);

    // Act
    await createVault(user, PASSWORD, 'correct horse battery stable');

    // Assert
    await waitFor(() =>
      expect(
        screen.getByLabelText('Confirm master password'),
      ).toHaveAccessibleDescription("The passwords don't match"),
    );
    expect(useLockStore.getState().status).toBe('notCreated');
  });

  it('creates the vault and opens it', async () => {
    // Arrange: remember what Rust receives
    const user = userEvent.setup();
    let received: unknown;
    mockIPC((command, args) => {
      if (command === 'create_vault') {
        received = args;
        return null;
      }
      // A new vault has no items
      if (command === 'vault_items') {
        return [];
      }
    });
    render(<CreateVaultScreen />);

    // Act
    await createVault(user, PASSWORD);

    // Assert
    await waitFor(() =>
      expect(useLockStore.getState().status).toBe('unlocked'),
    );
    expect(received).toEqual({ masterPassword: PASSWORD });
  });

  it('explains why the vault could not be created', async () => {
    // Arrange: Rust can't write the file
    const user = userEvent.setup();
    mockIPC(() => Promise.reject({ kind: 'storage' }));
    render(<CreateVaultScreen />);

    // Act
    await createVault(user, PASSWORD);

    // Assert
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "The vault couldn't be read or saved",
    );
    expect(useLockStore.getState().status).toBe('notCreated');
  });
});
