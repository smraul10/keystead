import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('calls onChange with the new checked state', async () => {
    // Arrange
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Checkbox label='Digits' checked={true} onChange={handleChange} />);

    // Act
    await user.click(screen.getByRole('checkbox', { name: 'Digits' }));

    // Assert
    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it('reflects the checked prop', () => {
    // Arrange
    render(<Checkbox label='Digits' checked={false} onChange={vi.fn()} />);

    // Assert
    expect(screen.getByRole('checkbox', { name: 'Digits' })).not.toBeChecked();
  });

  it('can be disabled', () => {
    // Arrange
    render(
      <Checkbox
        label='Digits'
        disabled={true}
        checked={false}
        onChange={vi.fn()}
      />,
    );

    // Assert
    expect(screen.getByRole('checkbox', { name: 'Digits' })).toBeDisabled();
  });
});
