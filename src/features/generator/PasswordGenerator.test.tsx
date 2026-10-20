import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PasswordGenerator } from './PasswordGenerator';
import { DEFAULT_PASSWORD_OPTIONS } from './options';

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
    await user.click(screen.getByRole('button', { name: 'Regenerate' }));

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
    await user.click(screen.getByRole('button', { name: 'Regenerate' }));

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

  it('copies the password to the clipboard', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<PasswordGenerator />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Copy' }));

    // Assert
    expect(await navigator.clipboard.readText()).toBe(getPassword());
  });

  it('confirms that the password was copied', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<PasswordGenerator />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Copy' }));

    // Assert
    expect(
      await screen.findByRole('button', { name: 'Copied' }),
    ).toBeInTheDocument();
  });

  it('resets the copy confirmation when the options change', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<PasswordGenerator />);

    // Act: copy, wait for the confirmation, then change the length
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    await screen.findByRole('button', { name: 'Copied' });
    fireEvent.change(screen.getByRole('slider', { name: 'Length' }), {
      target: { value: '30' },
    });

    // Assert
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
  });

  it('changes the length when typing a valid number', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<PasswordGenerator />);
    const input = screen.getByRole('spinbutton', { name: 'Length' });

    // Act
    await user.clear(input);
    await user.type(input, '32');

    // Assert
    expect(getPassword()).toHaveLength(32);
  });

  it('ignores invalid lengths while typing', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<PasswordGenerator />);
    const input = screen.getByRole('spinbutton', { name: 'Length' });

    // Act
    await user.clear(input);
    await user.type(input, '5');

    // Assert
    expect(getPassword()).toHaveLength(20);
  });

  it('restores the current length when leaving an invalid value', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<PasswordGenerator />);
    const input = screen.getByRole('spinbutton', { name: 'Length' });

    // Act: type an invalid length, then move the focus away
    await user.clear(input);
    await user.type(input, '5');
    await user.tab();

    // Assert
    expect(input).toHaveValue(20);
  });

  it('shows the slider value in the number input', () => {
    // Arrange
    render(<PasswordGenerator />);

    // Act
    fireEvent.change(screen.getByRole('slider', { name: 'Length' }), {
      target: { value: '50' },
    });

    // Assert
    expect(screen.getByRole('spinbutton', { name: 'Length' })).toHaveValue(50);
  });

  it('shows the strength of the password', () => {
    // Arrange
    render(<PasswordGenerator />);

    // Assert: default options → 20 × log2(85) ≈ 128 bits → Excellent
    expect(screen.getByText('Excellent')).toBeInTheDocument();
  });

  it('updates the strength when the options change', () => {
    // Arrange
    render(<PasswordGenerator />);

    // Act: 8 characters from a pool of 85 → 8 × log2(85) ≈ 51 bits
    fireEvent.change(screen.getByRole('slider', { name: 'Length' }), {
      target: { value: '8' },
    });

    // Assert
    expect(screen.getByText('Weak')).toBeInTheDocument();
  });

  it('keeps the options panel closed by default', () => {
    // Arrange
    render(<PasswordGenerator />);

    // Assert
    const panel = screen.getByText('Options').closest('details');
    expect(panel).not.toHaveAttribute('open');
  });

  it('remembers that the options panel was opened', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<PasswordGenerator />);

    // Act
    await user.click(screen.getByText('Options'));

    // Assert
    await waitFor(() =>
      expect(localStorage.getItem('generator.panelOpen')).toBe('true'),
    );
  });

  it('opens the options panel if it was open last time', () => {
    // Arrange: the panel was left open in a previous session
    localStorage.setItem('generator.panelOpen', 'true');

    // Act
    render(<PasswordGenerator />);

    // Assert
    const panel = screen.getByText('Options').closest('details');
    expect(panel).toHaveAttribute('open');
  });

  it('remembers the chosen options', () => {
    // Arrange
    render(<PasswordGenerator />);

    // Act
    fireEvent.change(screen.getByRole('slider', { name: 'Length' }), {
      target: { value: '32' },
    });

    // Assert
    const saved = JSON.parse(localStorage.getItem('generator.options') ?? '{}');
    expect(saved).toMatchObject({ length: 32 });
  });

  it('starts with the options saved last time', () => {
    // Arrange
    localStorage.setItem(
      'generator.options',
      JSON.stringify({ ...DEFAULT_PASSWORD_OPTIONS, length: 32 }),
    );

    // Act
    render(<PasswordGenerator />);

    // Assert
    expect(getPassword()).toHaveLength(32);
  });

  it('ignores corrupted saved options', () => {
    // Arrange
    localStorage.setItem(
      'generator.options',
      JSON.stringify({ ...DEFAULT_PASSWORD_OPTIONS, length: 'test' }),
    );

    // Act
    render(<PasswordGenerator />);

    // Assert
    expect(getPassword()).toHaveLength(20);
  });
});
