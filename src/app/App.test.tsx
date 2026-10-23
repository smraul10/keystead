import { mockIPC } from '@tauri-apps/api/mocks';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import type { VaultStatus } from '@/api';
import { DEMO_MASTER_PASSWORD, useLockStore } from '@/features/lock';
import { App } from './App';

const PASSWORD = 'correct horse battery staple';

// A stand-in for Rust that remembers whether the vault exists and is open
function fakeRust(initial: VaultStatus) {
  let status = initial;
  mockIPC((command) => {
    switch (command) {
      case 'vault_status':
        return status;
      case 'create_vault':
        status = 'unlocked';
        return null;
      case 'lock_vault':
        status = 'locked';
        return null;
    }
  });
}

// Most tests use the vault: launch the app with it open (as after reloading
// the window while it is unlocked) and wait for Rust's answer
async function renderUnlocked() {
  fakeRust('unlocked');
  render(<App />);
  await screen.findByRole('heading', { name: 'All items' });
}

describe('App', () => {
  // The store lives outside React: start every test as a fresh launch
  beforeEach(() => {
    useLockStore.setState(useLockStore.getInitialState());
  });

  it('asks to create a vault on first launch', async () => {
    fakeRust('notCreated');

    render(<App />);

    expect(
      await screen.findByLabelText('Confirm master password'),
    ).toBeInTheDocument();
  });

  it('shows the new vault after creating it', async () => {
    // Arrange
    const user = userEvent.setup();
    fakeRust('notCreated');
    render(<App />);

    // Act
    await user.type(await screen.findByLabelText('Master password'), PASSWORD);
    await user.type(screen.getByLabelText('Confirm master password'), PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Create vault' }));

    // Assert
    expect(
      await screen.findByRole('heading', { name: 'All items' }),
    ).toBeInTheDocument();
  });

  it('starts locked when there is a vault', async () => {
    fakeRust('locked');

    render(<App />);

    // Only the unlock screen, nothing of the vault
    expect(await screen.findByLabelText('Master password')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'All items' }),
    ).not.toBeInTheDocument();
  });

  it('explains why it cannot start', async () => {
    // Rust can't check the data folder
    mockIPC(() => Promise.reject({ kind: 'storage' }));

    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "The vault couldn't be read or saved",
    );
  });

  it('shows the vault after unlocking', async () => {
    // Arrange
    const user = userEvent.setup();
    fakeRust('locked');
    render(<App />);

    // Act
    await user.type(
      await screen.findByLabelText('Master password'),
      `${DEMO_MASTER_PASSWORD}{Enter}`,
    );

    // Assert
    expect(
      await screen.findByRole('heading', { name: 'All items' }),
    ).toBeInTheDocument();
  });

  it('locks the vault', async () => {
    // Arrange
    const user = userEvent.setup();
    await renderUnlocked();

    // Act
    await user.click(screen.getByRole('button', { name: 'Lock' }));

    // Assert
    expect(screen.getByLabelText('Master password')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'All items' }),
    ).not.toBeInTheDocument();
  });

  it('forgets what was open after locking', async () => {
    // Arrange: open the Generator section, then lock
    const user = userEvent.setup();
    await renderUnlocked();
    await user.click(screen.getByRole('button', { name: 'Generator' }));
    await user.click(screen.getByRole('button', { name: 'Lock' }));

    // Act
    await user.type(
      screen.getByLabelText('Master password'),
      `${DEMO_MASTER_PASSWORD}{Enter}`,
    );

    // Assert: back to the default section
    expect(
      await screen.findByRole('heading', { name: 'All items' }),
    ).toBeInTheDocument();
  });

  it('shows all items by default', async () => {
    // Arrange
    await renderUnlocked();

    // Assert
    expect(
      screen.getByRole('heading', { name: 'All items' }),
    ).toBeInTheDocument();
  });

  it('shows the generator when choosing its section', async () => {
    // Arrange
    const user = userEvent.setup();
    await renderUnlocked();

    // Act
    await user.click(screen.getByRole('button', { name: 'Generator' }));

    // Assert: the generator replaces the item list
    expect(
      screen.getByRole('status', { name: 'Generated password' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'All items' }),
    ).not.toBeInTheDocument();
  });

  it('shows the favorites when choosing their section', async () => {
    // Arrange
    const user = userEvent.setup();
    await renderUnlocked();

    // Act
    await user.click(screen.getByRole('button', { name: 'Favorites' }));

    // Assert
    expect(
      screen.getByRole('heading', { level: 1, name: 'Favorites' }),
    ).toBeInTheDocument();
  });

  it('shows the trash when choosing its section', async () => {
    // Arrange
    const user = userEvent.setup();
    await renderUnlocked();

    // Act
    await user.click(screen.getByRole('button', { name: 'Trash' }));

    // Assert
    expect(
      screen.getByRole('heading', { level: 1, name: 'Trash' }),
    ).toBeInTheDocument();
  });

  it('marks the current section', async () => {
    // Arrange
    const user = userEvent.setup();
    await renderUnlocked();

    // Act
    await user.click(screen.getByRole('button', { name: 'Generator' }));

    // Assert
    expect(screen.getByRole('button', { name: 'Generator' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('button', { name: 'All items' }),
    ).not.toHaveAttribute('aria-current');
  });
});
