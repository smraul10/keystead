import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { fakeClipboard } from '@/test/fakeClipboard';
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

const TRASHED = makeItem({
  title: 'GitHub',
  deletedAt: '2026-10-22T10:00:00.000Z',
});

function renderDetails(item: Item = ITEM) {
  const actions = {
    onEdit: vi.fn(),
    onToggleFavorite: vi.fn(),
    onMoveToTrash: vi.fn(),
    onRestore: vi.fn(),
    onDeleteForever: vi.fn(),
  };
  render(<ItemDetails item={item} {...actions} />);
  return actions;
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
    // Arrange: makeItem leaves username, password, url and notes empty
    renderDetails(makeItem({ title: 'Home Wi-Fi' }));

    // Assert
    expect(screen.queryByText('Username')).not.toBeInTheDocument();
    expect(screen.queryByText('Password')).not.toBeInTheDocument();
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
    const clipboard = fakeClipboard();
    renderDetails();

    // Act
    await user.click(screen.getByRole('button', { name: 'Copy password' }));

    // Assert: copied, but still hidden on screen
    expect(clipboard.text).toBe(ITEM.password);
    expect(screen.queryByText(ITEM.password)).not.toBeInTheDocument();
  });

  it('copies the username', async () => {
    // Arrange
    const user = userEvent.setup();
    const clipboard = fakeClipboard();
    renderDetails();

    // Act
    await user.click(screen.getByRole('button', { name: 'Copy username' }));

    // Assert
    expect(clipboard.text).toBe(ITEM.username);
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

  it('asks to edit the item', async () => {
    const user = userEvent.setup();
    const { onEdit } = renderDetails();

    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('asks to move the item to the trash', async () => {
    const user = userEvent.setup();
    const { onMoveToTrash } = renderDetails();

    await user.click(screen.getByRole('button', { name: 'Move to trash' }));

    expect(onMoveToTrash).toHaveBeenCalledOnce();
  });

  describe('in the trash', () => {
    it('shows since when the item is in the trash', () => {
      renderDetails(TRASHED);

      expect(screen.getByText('In the trash since')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Move to trash' }),
      ).not.toBeInTheDocument();
    });

    it('hides the favorite star', () => {
      renderDetails(TRASHED);

      expect(
        screen.queryByRole('button', { name: 'Favorite' }),
      ).not.toBeInTheDocument();
    });

    it('cannot be edited until restored', () => {
      renderDetails(TRASHED);

      expect(
        screen.queryByRole('button', { name: 'Edit' }),
      ).not.toBeInTheDocument();
    });

    it('asks to restore the item', async () => {
      const user = userEvent.setup();
      const { onRestore } = renderDetails(TRASHED);

      await user.click(screen.getByRole('button', { name: 'Restore' }));

      expect(onRestore).toHaveBeenCalledOnce();
    });

    it('asks for confirmation before deleting forever', async () => {
      // Arrange
      const user = userEvent.setup();
      const { onDeleteForever } = renderDetails(TRASHED);

      // Act + Assert: the first click only asks
      await user.click(screen.getByRole('button', { name: 'Delete forever' }));
      expect(onDeleteForever).not.toHaveBeenCalled();
      // The safe option gets the focus, so a stray Enter deletes nothing
      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();

      // Act + Assert: confirming deletes
      await user.click(
        screen.getByRole('button', { name: 'Yes, delete forever' }),
      );
      expect(onDeleteForever).toHaveBeenCalledOnce();
    });

    it('cancels deleting forever', async () => {
      // Arrange
      const user = userEvent.setup();
      const { onDeleteForever } = renderDetails(TRASHED);
      await user.click(screen.getByRole('button', { name: 'Delete forever' }));

      // Act
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      // Assert: nothing deleted, back to the first step
      expect(onDeleteForever).not.toHaveBeenCalled();
      expect(
        screen.getByRole('button', { name: 'Delete forever' }),
      ).toBeInTheDocument();
    });
  });
});
