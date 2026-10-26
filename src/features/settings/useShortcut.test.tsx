import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SHORTCUTS, type ShortcutAction } from './shortcuts';
import { useSettingsStore } from './settingsStore';
import { useShortcut, useShortcutHint } from './useShortcut';

interface HarnessProps {
  action: ShortcutAction;
  run: () => void;
  enabled?: boolean;
  whileTyping?: boolean;
}

// A text field, and a button with the action's hint
function Harness({ action, run, enabled, whileTyping }: HarnessProps) {
  useShortcut(action, run, {
    ...(enabled === undefined ? {} : { enabled }),
    ...(whileTyping === undefined ? {} : { whileTyping }),
  });
  const hint = useShortcutHint(action);
  return (
    <>
      <input aria-label='Field' />
      <button type='button' {...hint}>
        Action
      </button>
    </>
  );
}

// The settings store survives between tests: start with the defaults
beforeEach(() => {
  useSettingsStore.setState({ shortcuts: DEFAULT_SHORTCUTS });
});

describe('useShortcut', () => {
  it('runs the action on its shortcut', async () => {
    const user = userEvent.setup();
    const run = vi.fn();
    render(<Harness action='lock' run={run} />);

    await user.keyboard('{Control>}l{/Control}');

    expect(run).toHaveBeenCalledOnce();
  });

  it('stops what the key would do otherwise', () => {
    render(<Harness action='lock' run={vi.fn()} />);

    // false: the event was cancelled (e.g. the webview's own find for Ctrl+F)
    expect(fireEvent.keyDown(window, { key: 'l', ctrlKey: true })).toBe(false);
  });

  it('runs nothing on other keys', async () => {
    const user = userEvent.setup();
    const run = vi.fn();
    render(<Harness action='lock' run={run} />);

    await user.keyboard('l{Control>}k{/Control}');

    expect(run).not.toHaveBeenCalled();
  });

  it('leaves a text field alone', async () => {
    // Delete must erase text there, not move an item to the trash
    const user = userEvent.setup();
    const run = vi.fn();
    render(<Harness action='moveToTrash' run={run} />);
    await user.click(screen.getByLabelText('Field'));

    await user.keyboard('{Delete}');

    expect(run).not.toHaveBeenCalled();
  });

  it('works in a text field too when asked', async () => {
    const user = userEvent.setup();
    const run = vi.fn();
    render(<Harness action='lock' run={run} whileTyping />);
    await user.click(screen.getByLabelText('Field'));

    await user.keyboard('{Control>}l{/Control}');

    expect(run).toHaveBeenCalledOnce();
  });

  it('does nothing while disabled', async () => {
    const user = userEvent.setup();
    const run = vi.fn();
    render(<Harness action='lock' run={run} enabled={false} />);

    await user.keyboard('{Control>}l{/Control}');

    expect(run).not.toHaveBeenCalled();
  });

  it('uses the shortcut saved in Settings', async () => {
    const user = userEvent.setup();
    const run = vi.fn();
    useSettingsStore.setState({
      shortcuts: { ...DEFAULT_SHORTCUTS, lock: 'Control+K' },
    });
    render(<Harness action='lock' run={run} />);

    await user.keyboard('{Control>}l{/Control}{Control>}k{/Control}');

    expect(run).toHaveBeenCalledOnce();
  });
});

describe('useShortcutHint', () => {
  it('tells the shortcut in a tooltip and to screen readers', () => {
    render(<Harness action='lock' run={vi.fn()} />);

    const button = screen.getByRole('button', { name: 'Action' });
    expect(button).toHaveAttribute('title', 'Lock (Ctrl+L)');
    expect(button).toHaveAttribute('aria-keyshortcuts', 'Control+L');
  });
});
