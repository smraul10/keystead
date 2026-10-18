import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PasswordGenerator } from './PasswordGenerator';

describe('PasswordGenerator', () => {
  it('shows a generated password with the default length', () => {
    // Arrange
    render(<PasswordGenerator />);

    // Assert
    const input = screen.getByRole<HTMLInputElement>('textbox', {
      name: 'Generated password',
    });
    expect(input.value).toHaveLength(20);
  });

  it('generates a new password when clicking regenerate', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<PasswordGenerator />);
    const input = screen.getByRole<HTMLInputElement>('textbox', {
      name: 'Generated password',
    });
    const before = input.value;

    // Act
    await user.click(
      screen.getByRole('button', { name: 'Regenerate password' }),
    );

    // Assert
    expect(input.value).not.toBe(before);
  });

  it('regenerates the password when the length changes', () => {
    // Arrange
    render(<PasswordGenerator />);
    const slider = screen.getByRole('slider', { name: 'Length' });

    // Act
    fireEvent.change(slider, { target: { value: '32' } });

    // Assert
    const input = screen.getByRole<HTMLInputElement>('textbox', {
      name: 'Generated password',
    });
    expect(input.value).toHaveLength(32);
  });

  it('keeps the chosen length when regenerating', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<PasswordGenerator />);
    const slider = screen.getByRole('slider', { name: 'Length' });

    // Act: choose a length, then regenerate
    fireEvent.change(slider, { target: { value: '32' } });
    await user.click(
      screen.getByRole('button', { name: 'Regenerate password' }),
    );

    // Assert
    const input = screen.getByRole<HTMLInputElement>('textbox', {
      name: 'Generated password',
    });
    expect(input.value).toHaveLength(32);
  });
});
