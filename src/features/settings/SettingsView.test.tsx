import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from './settings';
import { SettingsView } from './SettingsView';
import { useSettingsStore } from './settingsStore';

describe('SettingsView', () => {
  beforeEach(() => {
    useSettingsStore.setState(DEFAULT_SETTINGS);
  });

  it('shows the current settings', () => {
    useSettingsStore.setState({ autoLockMinutes: 15, clipboardSeconds: 60 });

    render(<SettingsView />);

    expect(screen.getByLabelText('Lock after inactivity')).toHaveDisplayValue(
      '15 minutes',
    );
    expect(screen.getByLabelText('Clear clipboard after')).toHaveDisplayValue(
      '60 seconds',
    );
  });

  it('changes how long the vault stays unlocked without activity', async () => {
    const user = userEvent.setup();
    render(<SettingsView />);

    await user.selectOptions(
      screen.getByLabelText('Lock after inactivity'),
      '1 hour',
    );

    expect(useSettingsStore.getState().autoLockMinutes).toBe(60);
  });

  it('changes how long a copy stays in the clipboard', async () => {
    const user = userEvent.setup();
    render(<SettingsView />);

    await user.selectOptions(
      screen.getByLabelText('Clear clipboard after'),
      '10 seconds',
    );

    expect(useSettingsStore.getState().clipboardSeconds).toBe(10);
  });

  it('changes the theme', async () => {
    const user = userEvent.setup();
    render(<SettingsView />);

    await user.selectOptions(screen.getByLabelText('Theme'), 'Dark');

    expect(useSettingsStore.getState().theme).toBe('dark');
  });

  it('lists the keyboard shortcuts', () => {
    render(<SettingsView />);

    const shortcuts = screen.getByRole('region', {
      name: 'Keyboard shortcuts',
    });
    expect(shortcuts).toHaveTextContent('LockCtrl+L');
    expect(shortcuts).toHaveTextContent('Move through the list↑ ↓');
  });
});
