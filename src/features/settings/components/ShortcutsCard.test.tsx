import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSettingsStore } from '../settingsStore';
import { DEFAULT_SHORTCUTS } from '../shortcuts';
import { ShortcutsCard } from './ShortcutsCard';

function lockShortcut() {
  return useSettingsStore.getState().shortcuts.lock;
}

describe('ShortcutsCard', () => {
  beforeEach(() => {
    useSettingsStore.setState({ shortcuts: DEFAULT_SHORTCUTS });
  });

  it('lists every shortcut', () => {
    render(<ShortcutsCard />);

    const card = screen.getByRole('region', { name: 'Keyboard shortcuts' });
    expect(card).toHaveTextContent('LockCtrl+L');
    expect(card).toHaveTextContent('Move through the list↑ ↓');
  });

  it('changes a shortcut to the keys pressed', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<ShortcutsCard />);

    // Act
    await user.click(
      screen.getByRole('button', {
        name: 'Change the shortcut for Lock (Ctrl+L)',
      }),
    );
    await user.keyboard('{Control>}k{/Control}');

    // Assert
    expect(lockShortcut()).toBe('Control+K');
    expect(
      screen.getByRole('button', {
        name: 'Change the shortcut for Lock (Ctrl+K)',
      }),
    ).toHaveFocus();
  });

  it('waits for the keys while recording', async () => {
    const user = userEvent.setup();
    render(<ShortcutsCard />);

    await user.click(
      screen.getByRole('button', { name: /Change the shortcut for Lock/ }),
    );

    expect(
      screen.getByRole('button', { name: 'Press the new shortcut for Lock' }),
    ).toHaveTextContent('Press the new shortcut…');
  });

  it('keeps the shortcut on Esc', async () => {
    const user = userEvent.setup();
    render(<ShortcutsCard />);
    await user.click(
      screen.getByRole('button', { name: /Change the shortcut for Lock/ }),
    );

    await user.keyboard('{Escape}');

    expect(lockShortcut()).toBe('Control+L');
    expect(
      screen.getByRole('button', {
        name: 'Change the shortcut for Lock (Ctrl+L)',
      }),
    ).toBeInTheDocument();
  });

  it('explains why a shortcut cannot be used, and keeps waiting', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<ShortcutsCard />);
    await user.click(
      screen.getByRole('button', { name: /Change the shortcut for Lock/ }),
    );

    // Act: Search already uses Ctrl+F
    await user.keyboard('{Control>}f{/Control}');

    // Assert: the problem is linked to the button, which still waits
    const button = screen.getByRole('button', {
      name: 'Press the new shortcut for Lock',
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Already used by Search',
    );
    expect(button).toHaveAccessibleDescription('Already used by Search');
    expect(lockShortcut()).toBe('Control+L');

    // Another try works
    await user.keyboard('{Control>}k{/Control}');
    expect(lockShortcut()).toBe('Control+K');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('lets Tab leave while recording', async () => {
    // Never a trap for the keyboard: Tab moves on and stops recording
    const user = userEvent.setup();
    render(<ShortcutsCard />);
    await user.click(
      screen.getByRole('button', { name: /Change the shortcut for Lock/ }),
    );

    await user.tab();

    expect(
      screen.getByRole('button', {
        name: 'Change the shortcut for Lock (Ctrl+L)',
      }),
    ).not.toHaveFocus();
    expect(
      screen.queryByText('Press the new shortcut…'),
    ).not.toBeInTheDocument();
  });

  it('resets every shortcut', async () => {
    const user = userEvent.setup();
    useSettingsStore.setState({
      shortcuts: { ...DEFAULT_SHORTCUTS, lock: 'Control+K' },
    });
    render(<ShortcutsCard />);

    await user.click(screen.getByRole('button', { name: 'Reset to defaults' }));

    expect(useSettingsStore.getState().shortcuts).toEqual(DEFAULT_SHORTCUTS);
  });
});
