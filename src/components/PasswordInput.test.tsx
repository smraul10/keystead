import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dices } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { IconButton } from './IconButton';
import { PasswordInput } from './PasswordInput';

function renderInput(revealed = false) {
  const onRevealedChange = vi.fn();
  render(
    <>
      <label htmlFor='password'>Password</label>
      <PasswordInput
        id='password'
        revealed={revealed}
        onRevealedChange={onRevealedChange}
      />
    </>,
  );
  return { onRevealedChange };
}

describe('PasswordInput', () => {
  it('works with a label like any input', () => {
    renderInput();

    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('hides the password unless revealed', () => {
    renderInput();

    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password',
    );
    expect(
      screen.getByRole('button', { name: 'Show password' }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows the password when revealed', () => {
    renderInput(true);

    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
    expect(
      screen.getByRole('button', { name: 'Show password' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('asks to show the password', async () => {
    const user = userEvent.setup();
    const { onRevealedChange } = renderInput();

    await user.click(screen.getByRole('button', { name: 'Show password' }));

    expect(onRevealedChange).toHaveBeenCalledWith(true);
  });

  it('shows extra actions inside the field', () => {
    render(
      <PasswordInput
        aria-label='Password'
        revealed={false}
        onRevealedChange={vi.fn()}
        actions={
          <IconButton label='Generate password'>
            <Dices />
          </IconButton>
        }
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Generate password' }),
    ).toBeInTheDocument();
  });
});
