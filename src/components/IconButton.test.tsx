import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pencil, Star } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('uses the label as its accessible name', () => {
    render(
      <IconButton label='Edit'>
        <Pencil />
      </IconButton>,
    );

    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <IconButton label='Edit' onClick={handleClick}>
        <Pencil />
      </IconButton>,
    );

    // Act
    await user.click(screen.getByRole('button', { name: 'Edit' }));

    // Assert
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('never submits a form', () => {
    render(
      <IconButton label='Edit'>
        <Pencil />
      </IconButton>,
    );

    expect(screen.getByRole('button', { name: 'Edit' })).toHaveAttribute(
      'type',
      'button',
    );
  });

  it('can be a toggle', () => {
    render(
      <IconButton label='Favorite' aria-pressed>
        <Star />
      </IconButton>,
    );

    expect(screen.getByRole('button', { name: 'Favorite' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
