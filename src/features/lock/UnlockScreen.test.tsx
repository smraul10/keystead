import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEMO_MASTER_PASSWORD, useLockStore } from './lockStore';
import { UnlockScreen } from './UnlockScreen';

describe('UnlockScreen', () => {
  beforeEach(() => {
    useLockStore.setState({ locked: true });
  });

  it('asks for the master password', () => {
    render(<UnlockScreen />);

    expect(screen.getByLabelText('Master password')).toHaveFocus();
  });

  it('shows the master password of the demo vault', () => {
    render(<UnlockScreen />);

    expect(screen.getByText(DEMO_MASTER_PASSWORD)).toBeInTheDocument();
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
    expect(useLockStore.getState().locked).toBe(true);
  });

  it('rejects a wrong master password and keeps it selected', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<UnlockScreen />);
    const field = screen.getByLabelText('Master password');

    // Act
    await user.type(field, 'wrong');
    await user.click(screen.getByRole('button', { name: 'Unlock' }));

    // Assert: still locked, with the error linked to the field
    await waitFor(() =>
      expect(field).toHaveAccessibleDescription('Wrong master password'),
    );
    expect(useLockStore.getState().locked).toBe(true);
    // Kept and selected: typing replaces it, or the eye shows the typo
    expect(field).toHaveValue('wrong');
    expect(field).toHaveFocus();
    expect(field).toHaveProperty('selectionStart', 0);
    expect(field).toHaveProperty('selectionEnd', 'wrong'.length);
  });

  it('unlocks with the right master password', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<UnlockScreen />);

    // Act: Enter submits the form
    await user.type(
      screen.getByLabelText('Master password'),
      `${DEMO_MASTER_PASSWORD}{Enter}`,
    );

    // Assert
    await waitFor(() => expect(useLockStore.getState().locked).toBe(false));
  });
});
