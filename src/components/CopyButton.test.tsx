import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CopyButton } from './CopyButton';

describe('CopyButton', () => {
  it('copies the text when clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<CopyButton text='raul-dev' label='Copy username' />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Copy username' }));

    // Assert
    expect(await navigator.clipboard.readText()).toBe('raul-dev');
  });

  it('confirms the copy', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<CopyButton text='raul-dev' label='Copy username' />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Copy username' }));

    // Assert
    expect(
      await screen.findByRole('button', { name: 'Copied' }),
    ).toBeInTheDocument();
  });
});
