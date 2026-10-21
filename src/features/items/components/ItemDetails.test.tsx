import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { makeItem } from '../makeItem';
import { ItemDetails } from './ItemDetails';

const ITEM = makeItem({
  title: 'GitHub',
  username: 'raul-dev',
  password: 'b,YjHm4^9aBBNC[zP]GD',
  url: 'https://github.com',
  notes: 'Recovery codes are in the safe.',
  updatedAt: '2026-09-02T18:40:00.000Z',
});

describe('ItemDetails', () => {
  it('shows the title as a heading', () => {
    render(<ItemDetails item={ITEM} />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'GitHub' }),
    ).toBeInTheDocument();
  });

  it('shows the username, website and notes', () => {
    render(<ItemDetails item={ITEM} />);

    expect(screen.getByText('raul-dev')).toBeInTheDocument();
    expect(screen.getByText('https://github.com')).toBeInTheDocument();
    expect(
      screen.getByText('Recovery codes are in the safe.'),
    ).toBeInTheDocument();
  });

  it('hides empty fields', () => {
    // Arrange: makeItem leaves username, url and notes empty
    render(<ItemDetails item={makeItem({ title: 'Home Wi-Fi' })} />);

    // Assert
    expect(screen.queryByText('Username')).not.toBeInTheDocument();
    expect(screen.queryByText('Website')).not.toBeInTheDocument();
    expect(screen.queryByText('Notes')).not.toBeInTheDocument();
  });

  it('hides the password by default', () => {
    render(<ItemDetails item={ITEM} />);

    expect(screen.queryByText(ITEM.password)).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Show password' }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows the password when asked', async () => {
    const user = userEvent.setup();
    render(<ItemDetails item={ITEM} />);

    await user.click(screen.getByRole('button', { name: 'Show password' }));

    expect(screen.getByText(ITEM.password)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Show password' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows when the item was last edited', () => {
    render(<ItemDetails item={ITEM} />);

    expect(screen.getByText('Last edited')).toBeInTheDocument();
    // The visible date depends on the system language: check the exact value
    expect(document.querySelector('time')).toHaveAttribute(
      'datetime',
      ITEM.updatedAt,
    );
  });
});
