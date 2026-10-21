import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { makeItem } from '../makeItem';
import { ItemDetails } from './ItemDetails';
import type { Item } from '../item';

const ITEM = makeItem({
  title: 'GitHub',
  username: 'raul-dev',
  password: 'b,YjHm4^9aBBNC[zP]GD',
  url: 'https://github.com',
  notes: 'Recovery codes are in the safe.',
  updatedAt: '2026-09-02T18:40:00.000Z',
});

function renderDetails(item: Item = ITEM) {
  const onToggleFavorite = vi.fn();
  render(<ItemDetails item={item} onToggleFavorite={onToggleFavorite} />);
  return { onToggleFavorite };
}

describe('ItemDetails', () => {
  it('shows the title as a heading', () => {
    renderDetails();

    expect(
      screen.getByRole('heading', { level: 2, name: 'GitHub' }),
    ).toBeInTheDocument();
  });

  it('shows the username, website and notes', () => {
    renderDetails();

    expect(screen.getByText('raul-dev')).toBeInTheDocument();
    expect(screen.getByText('https://github.com')).toBeInTheDocument();
    expect(
      screen.getByText('Recovery codes are in the safe.'),
    ).toBeInTheDocument();
  });

  it('hides empty fields', () => {
    // Arrange: makeItem leaves username, url and notes empty
    renderDetails(makeItem({ title: 'Home Wi-Fi' }));

    // Assert
    expect(screen.queryByText('Username')).not.toBeInTheDocument();
    expect(screen.queryByText('Website')).not.toBeInTheDocument();
    expect(screen.queryByText('Notes')).not.toBeInTheDocument();
  });

  it('hides the password by default', () => {
    renderDetails();

    expect(screen.queryByText(ITEM.password)).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Show password' }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows the password when asked', async () => {
    const user = userEvent.setup();
    renderDetails();

    await user.click(screen.getByRole('button', { name: 'Show password' }));

    expect(screen.getByText(ITEM.password)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Show password' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows when the item was last edited', () => {
    renderDetails();

    expect(screen.getByText('Last edited')).toBeInTheDocument();
    // The visible date depends on the system language: check the exact value
    expect(document.querySelector('time')).toHaveAttribute(
      'datetime',
      ITEM.updatedAt,
    );
  });

  it('copies the password without showing it', async () => {
    // Arrange
    const user = userEvent.setup();
    renderDetails();

    // Act
    await user.click(screen.getByRole('button', { name: 'Copy password' }));

    // Assert: copied, but still hidden on screen
    expect(await navigator.clipboard.readText()).toBe(ITEM.password);
    expect(screen.queryByText(ITEM.password)).not.toBeInTheDocument();
  });

  it('copies the username', async () => {
    // Arrange
    const user = userEvent.setup();
    renderDetails();

    // Act
    await user.click(screen.getByRole('button', { name: 'Copy username' }));

    // Assert
    expect(await navigator.clipboard.readText()).toBe(ITEM.username);
  });

  it('shows whether the item is a favorite', () => {
    renderDetails(makeItem({ title: 'GitHub', favorite: true }));

    expect(screen.getByRole('button', { name: 'Favorite' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('asks to toggle the favorite when clicking the star', async () => {
    const user = userEvent.setup();
    const { onToggleFavorite } = renderDetails();

    await user.click(screen.getByRole('button', { name: 'Favorite' }));

    expect(onToggleFavorite).toHaveBeenCalledOnce();
  });
});
