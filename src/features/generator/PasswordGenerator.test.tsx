import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PasswordGenerator } from './PasswordGenerator';

function getPassword(): string {
  return (
    screen.getByRole('status', { name: 'Generated password' }).textContent ?? ''
  );
}

describe('PasswordGenerator', () => {
  it('shows a generated password with the default length', () => {
    // Arrange
    render(<PasswordGenerator />);

    // Assert
    expect(getPassword()).toHaveLength(20);
  });

  it('generates a new password when clicking regenerate', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<PasswordGenerator />);
    const before = getPassword();

    // Act
    await user.click(
      screen.getByRole('button', { name: 'Regenerate password' }),
    );

    // Assert
    expect(getPassword()).not.toBe(before);
  });

  it('regenerates the password when the length changes', () => {
    // Arrange
    render(<PasswordGenerator />);
    const slider = screen.getByRole('slider', { name: 'Length' });

    // Act
    fireEvent.change(slider, { target: { value: '32' } });

    // Assert
    expect(getPassword()).toHaveLength(32);
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
    expect(getPassword()).toHaveLength(32);
  });

  it.each([
    ['Lowercase', /[a-z]/],
    ['Uppercase', /[A-Z]/],
    ['Digits', /[0-9]/],
    ['Symbols', /[^a-zA-Z0-9]/],
  ])('removes %s characters when unchecked', async (name, pattern) => {
    // Arrange: longest password, so a broken checkbox can't pass by luck
    const user = userEvent.setup();
    render(<PasswordGenerator />);
    fireEvent.change(screen.getByRole('slider', { name: 'Length' }), {
      target: { value: '128' },
    });

    // Act
    await user.click(screen.getByRole('checkbox', { name }));

    // Assert
    expect(getPassword()).not.toMatch(pattern);
  });

  it('avoids ambiguous characters when the option is checked', async () => {
    // Arrange: longest password, so a broken checkbox can't pass by luck
    const user = userEvent.setup();
    render(<PasswordGenerator />);
    fireEvent.change(screen.getByRole('slider', { name: 'Length' }), {
      target: { value: '128' },
    });

    // Act
    await user.click(
      screen.getByRole('checkbox', { name: 'Avoid ambiguous characters' }),
    );

    // Assert
    expect(getPassword()).not.toMatch(/[0O1lI]/);
  });

  it('requires every selected type by default', () => {
    // Arrange
    render(<PasswordGenerator />);

    // Assert
    expect(
      screen.getByRole('checkbox', { name: 'Include every selected type' }),
    ).toBeChecked();
  });

  it('does not allow unchecking the last character type', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<PasswordGenerator />);

    // Act: uncheck every type except digits
    await user.click(screen.getByRole('checkbox', { name: 'Lowercase' }));
    await user.click(screen.getByRole('checkbox', { name: 'Uppercase' }));
    await user.click(screen.getByRole('checkbox', { name: 'Symbols' }));

    // Assert: digits is the only type left, so it can't be unchecked
    expect(screen.getByRole('checkbox', { name: 'Digits' })).toBeDisabled();
  });
});
