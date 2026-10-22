import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('calls onClick when clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Save</Button>);

    // Act
    await user.click(screen.getByRole('button', { name: 'Save' }));

    // Assert
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('renders its children', () => {
    // Arrange
    render(<Button onClick={vi.fn()}>Save</Button>);

    // Assert
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('never submits a form unless asked', () => {
    render(<Button>Cancel</Button>);

    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute(
      'type',
      'button',
    );
  });

  it('can submit a form', () => {
    render(
      <Button variant='primary' type='submit'>
        Save
      </Button>,
    );

    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute(
      'type',
      'submit',
    );
  });

  it('passes other button attributes through', () => {
    render(<Button autoFocus>Cancel</Button>);

    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });
});
