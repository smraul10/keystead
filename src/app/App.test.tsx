import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
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
