import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { ItemsView } from './ItemsView';
import { makeItem } from './makeItem';
import { useItemsStore } from './itemsStore';

const ITEMS = [
  makeItem({ title: 'Netflix', username: 'raul@example.com' }),
  makeItem({ title: 'amazon', username: 'raul@example.com' }),
  makeItem({ title: 'GitHub', username: 'raul-dev' }),
];

describe('ItemsView', () => {
  beforeEach(() => {
    useItemsStore.setState({ items: ITEMS });
  });

  it('lists the items sorted by title', () => {
    // Arrange
    render(<ItemsView />);

    // Assert
    const list = screen.getByRole('list', { name: 'Items' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent('amazon');
    expect(rows[1]).toHaveTextContent('GitHub');
    expect(rows[2]).toHaveTextContent('Netflix');
  });

  it('shows the username under each title', () => {
    // Arrange
    render(<ItemsView />);

    // Assert
    expect(screen.getByText('raul-dev')).toBeInTheDocument();
  });

  it('shows an empty state when there are no items', () => {
    // Arrange
    useItemsStore.setState({ items: [] });
    render(<ItemsView />);

    // Assert
    expect(screen.getByText('No items yet')).toBeInTheDocument();
  });

  it('selects an item when clicking it', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<ItemsView />);
    const button = screen.getByRole('button', { name: /GitHub/ });

    // Act
    await user.click(button);

    // Assert
    expect(button).toHaveAttribute('aria-current', 'true');
  });

  it('shows the selected item', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<ItemsView />);
    expect(screen.getByText('Select an item')).toBeInTheDocument();

    // Act
    await user.click(screen.getByRole('button', { name: /GitHub/ }));

    // Assert
    expect(
      screen.getByRole('heading', { level: 2, name: 'GitHub' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Select an item')).not.toBeInTheDocument();
  });

  it('hides the password again when selecting another item', async () => {
    // Arrange: reveal GitHub's password
    const user = userEvent.setup();
    render(<ItemsView />);
    await user.click(screen.getByRole('button', { name: /GitHub/ }));
    await user.click(screen.getByRole('button', { name: 'Show password' }));

    // Act
    await user.click(screen.getByRole('button', { name: /Netflix/ }));

    // Assert
    expect(
      screen.getByRole('button', { name: 'Show password' }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('filters the list while typing', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<ItemsView />);

    // Act
    await user.type(
      screen.getByRole('searchbox', { name: 'Search items' }),
      'git',
    );

    // Assert
    const rows = within(
      screen.getByRole('list', { name: 'Items' }),
    ).getAllByRole('listitem');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent('GitHub');
  });

  it('shows a message when nothing matches', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<ItemsView />);

    // Act
    await user.type(
      screen.getByRole('searchbox', { name: 'Search items' }),
      'zzz',
    );

    // Assert
    expect(screen.getByText('No items match your search')).toBeInTheDocument();
  });

  it('shows every item again when the search is cleared', async () => {
    // Arrange: filter the list first
    const user = userEvent.setup();
    render(<ItemsView />);
    const search = screen.getByRole('searchbox', { name: 'Search items' });
    await user.type(search, 'git');

    // Act
    await user.clear(search);

    // Assert
    const rows = within(
      screen.getByRole('list', { name: 'Items' }),
    ).getAllByRole('listitem');
    expect(rows).toHaveLength(3);
  });

  it('marks the selected item as favorite', async () => {
    const user = userEvent.setup();
    render(<ItemsView />);
    await user.click(screen.getByRole('button', { name: /GitHub/ }));

    await user.click(screen.getByRole('button', { name: 'Favorite' }));

    expect(screen.getByRole('button', { name: 'Favorite' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
