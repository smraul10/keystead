import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEMO_MASTER_PASSWORD, useLockStore } from '@/features/lock';
import { App } from './App';

describe('App', () => {
  // Most tests use the vault: start unlocked (the lock tests lock it first)
  beforeEach(() => {
    useLockStore.setState({ locked: false });
  });

  it('starts locked', () => {
    // Arrange: a fresh store starts locked
    useLockStore.setState({ locked: useLockStore.getInitialState().locked });

    // Act
    render(<App />);

    // Assert: only the unlock screen, nothing of the vault
    expect(screen.getByLabelText('Master password')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'All items' }),
    ).not.toBeInTheDocument();
  });

  it('shows the vault after unlocking', async () => {
    // Arrange
    const user = userEvent.setup();
    useLockStore.setState({ locked: true });
    render(<App />);

    // Act
    await user.type(
      screen.getByLabelText('Master password'),
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
    render(<App />);

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
    render(<App />);
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

  it('shows all items by default', () => {
    // Arrange
    render(<App />);

    // Assert
    expect(
      screen.getByRole('heading', { name: 'All items' }),
    ).toBeInTheDocument();
  });

  it('shows the generator when choosing its section', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<App />);

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
    render(<App />);

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
    render(<App />);

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
    render(<App />);

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
