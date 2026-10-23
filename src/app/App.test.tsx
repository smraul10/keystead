import { mockIPC } from '@tauri-apps/api/mocks';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Item, VaultStatus } from '@/api';
import { useItemsStore } from '@/features/items';
import { useLockStore } from '@/features/lock';
import { App } from './App';

const PASSWORD = 'correct horse battery staple';

const GITHUB: Item = {
  id: '1',
  title: 'GitHub',
  username: 'raul-dev',
  password: 'b,YjHm4^9aBBNC[zP]GD',
  url: 'https://github.com',
  notes: '',
  favorite: true,
  createdAt: '2026-03-14T10:12:00.000Z',
  updatedAt: '2026-09-02T18:40:00.000Z',
  deletedAt: null,
};

// A stand-in for Rust that remembers whether the vault exists and is open.
// Its vault holds GITHUB and only PASSWORD opens it; a new one is empty
function fakeRust(initial: VaultStatus) {
  let status = initial;
  let items = [GITHUB];
  mockIPC((command, args) => {
    switch (command) {
      case 'vault_status':
        return status;
      case 'create_vault':
        status = 'unlocked';
        items = [];
        return null;
      case 'unlock_vault':
        if (
          args &&
          'masterPassword' in args &&
          args.masterPassword === PASSWORD
        ) {
          status = 'unlocked';
          return null;
        }
        return Promise.reject({ kind: 'wrongPassword' });
      case 'vault_items':
        return status === 'unlocked'
          ? items
          : Promise.reject({ kind: 'locked' });
      case 'save_vault':
        if (args && 'items' in args && Array.isArray(args.items)) {
          items = args.items;
        }
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
  // The stores live outside React: start every test as a fresh launch
  beforeEach(() => {
    useLockStore.setState(useLockStore.getInitialState());
    useItemsStore.setState(useItemsStore.getInitialState());
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

  it('shows the items of the vault after unlocking it', async () => {
    // Arrange
    const user = userEvent.setup();
    fakeRust('locked');
    render(<App />);

    // Act
    await user.type(
      await screen.findByLabelText('Master password'),
      `${PASSWORD}{Enter}`,
    );

    // Assert
    expect(
      await screen.findByRole('heading', { name: 'All items' }),
    ).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });

  it('shows the items again after reloading the window', async () => {
    // Rust kept the vault open: no need to unlock it again
    await renderUnlocked();

    expect(screen.getByText('GitHub')).toBeInTheDocument();
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
      `${PASSWORD}{Enter}`,
    );

    // Assert: back to the default section
    expect(
      await screen.findByRole('heading', { name: 'All items' }),
    ).toBeInTheDocument();
  });

  it('keeps the changes after locking and unlocking', async () => {
    // Arrange: GitHub starts as a favorite
    const user = userEvent.setup();
    await renderUnlocked();
    await user.click(screen.getByRole('button', { name: /GitHub/ }));

    // Act: unmark it, lock and unlock
    await user.click(screen.getByRole('button', { name: 'Favorite' }));
    await user.click(screen.getByRole('button', { name: 'Lock' }));
    await user.type(
      await screen.findByLabelText('Master password'),
      `${PASSWORD}{Enter}`,
    );
    await user.click(await screen.findByRole('button', { name: /GitHub/ }));

    // Assert: the change came back from the vault
    expect(screen.getByRole('button', { name: 'Favorite' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('warns when the changes could not be saved', async () => {
    // Arrange: the vault opens, but the disk can't be written
    const user = userEvent.setup();
    await renderUnlocked();
    mockIPC(() => Promise.reject({ kind: 'storage' }));
    await user.click(screen.getByRole('button', { name: /GitHub/ }));

    // Act
    await user.click(screen.getByRole('button', { name: 'Favorite' }));

    // Assert
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Your changes couldn't be saved",
    );
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
