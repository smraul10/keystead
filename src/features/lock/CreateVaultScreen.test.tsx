import { mockIPC } from '@tauri-apps/api/mocks';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadEstimator } from '@/features/strength';
import { CreateVaultScreen } from './CreateVaultScreen';
import { useLockStore } from './lockStore';

// Strong (random), so creating the vault doesn't ask about it
const PASSWORD = 'tj7#Lq2v!Pz9wK*Rhm6k$Wq';
// At least 12 characters, but a common password with digits
const WEAK_PASSWORD = 'password1234';

// Remembers what Rust receives, like a vault that is created
function fakeRust() {
  const received: unknown[] = [];
  mockIPC((command, args) => {
    if (command === 'create_vault') {
      received.push(args);
      return null;
    }
    if (command === 'vault_items') {
      return [];
    }
  });
  return received;
}

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
  // The strength dictionaries are big: load them once, before the tests
  beforeAll(async () => {
    await loadEstimator();
  });

  beforeEach(() => {
    useLockStore.setState({ status: 'notCreated' });
  });

  it('shows how strong the master password is', async () => {
    const user = userEvent.setup();
    render(<CreateVaultScreen />);

    await user.type(screen.getByLabelText('Master password'), WEAK_PASSWORD);

    expect(await screen.findByText('Poor')).toBeInTheDocument();
  });

  it('asks before using a weak master password', async () => {
    // Arrange
    const user = userEvent.setup();
    const received = fakeRust();
    render(<CreateVaultScreen />);

    // Act
    await createVault(user, WEAK_PASSWORD);

    // Assert: nothing created yet, and the safe answer has the focus
    expect(await screen.findByText(/Use it anyway\?/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Choose another' }),
    ).toHaveFocus();
    expect(received).toEqual([]);
  });

  it('uses a weak master password if told so', async () => {
    // Arrange
    const user = userEvent.setup();
    const received = fakeRust();
    render(<CreateVaultScreen />);
    await createVault(user, WEAK_PASSWORD);

    // Act
    await user.click(
      await screen.findByRole('button', { name: 'Use it anyway' }),
    );

    // Assert
    await waitFor(() =>
      expect(useLockStore.getState().status).toBe('unlocked'),
    );
    expect(received).toEqual([{ masterPassword: WEAK_PASSWORD }]);
  });

  it('lets you choose another master password', async () => {
    // Arrange
    const user = userEvent.setup();
    fakeRust();
    render(<CreateVaultScreen />);
    await createVault(user, WEAK_PASSWORD);

    // Act
    await user.click(
      await screen.findByRole('button', { name: 'Choose another' }),
    );

    // Assert: back to the field, with the weak password selected
    const field = screen.getByLabelText('Master password');
    expect(field).toHaveFocus();
    expect(field).toHaveProperty('selectionEnd', WEAK_PASSWORD.length);
    expect(screen.queryByText(/Use it anyway\?/)).not.toBeInTheDocument();
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
