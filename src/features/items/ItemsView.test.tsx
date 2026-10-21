import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ItemsView } from './ItemsView';
import { makeItem } from './makeItem';

const ITEMS = [
  makeItem({ title: 'Netflix', username: 'raul@example.com' }),
  makeItem({ title: 'amazon', username: 'raul@example.com' }),
  makeItem({ title: 'GitHub', username: 'raul-dev' }),
];

describe('ItemsView', () => {
  it('lists the items sorted by title', () => {
    // Arrange
    render(<ItemsView items={ITEMS} />);

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
    render(<ItemsView items={ITEMS} />);

    // Assert
    expect(screen.getByText('raul-dev')).toBeInTheDocument();
  });

  it('shows an empty state when there are no items', () => {
    // Arrange
    render(<ItemsView items={[]} />);

    // Assert
    expect(screen.getByText('No items yet')).toBeInTheDocument();
  });

  it('selects an item when clicking it', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<ItemsView items={ITEMS} />);
    const button = screen.getByRole('button', { name: /GitHub/ });

    // Act
    await user.click(button);

    // Assert
    expect(button).toHaveAttribute('aria-current', 'true');
  });

  it('shows the selected item', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<ItemsView items={ITEMS} />);
    expect(screen.getByText('Select an item')).toBeInTheDocument();

    // Act
    await user.click(screen.getByRole('button', { name: /GitHub/ }));

    // Assert
    expect(
      screen.getByRole('heading', { level: 2, name: 'GitHub' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Select an item')).not.toBeInTheDocument();
  });
});
