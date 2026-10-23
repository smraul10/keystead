import { mockIPC } from '@tauri-apps/api/mocks';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useItemsStore } from '../itemsStore';
import { SaveErrorBanner } from './SaveErrorBanner';

describe('SaveErrorBanner', () => {
  beforeEach(() => {
    useItemsStore.setState({ items: [], saveError: null });
  });

  it('shows nothing while every change is saved', () => {
    render(<SaveErrorBanner />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('says why the changes could not be saved', () => {
    useItemsStore.setState({ saveError: { kind: 'storage' } });

    render(<SaveErrorBanner />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent("Your changes couldn't be saved");
    expect(alert).toHaveTextContent('Check the disk and its permissions');
  });

  it('goes away once trying again works', async () => {
    // Arrange: the disk works again
    const user = userEvent.setup();
    useItemsStore.setState({ saveError: { kind: 'storage' } });
    mockIPC(() => null);
    render(<SaveErrorBanner />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Assert
    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument(),
    );
  });
});
