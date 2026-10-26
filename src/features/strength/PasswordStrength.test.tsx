import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadEstimator } from './estimator';
import { PasswordStrength } from './PasswordStrength';

describe('PasswordStrength', () => {
  // The dictionaries are big: load them once, before the tests
  beforeAll(async () => {
    await loadEstimator();
  });

  it('shows nothing while the password is empty', () => {
    render(<PasswordStrength password='' />);

    expect(screen.queryByText(/Password strength/)).not.toBeInTheDocument();
  });

  it('shows how strong the password is', async () => {
    render(<PasswordStrength password='password1234' />);

    expect(await screen.findByText('Poor')).toBeInTheDocument();
  });

  it('rates a random password like the generator', async () => {
    render(<PasswordStrength password='b,YjHm4^9aBBNC[zP]GD' />);

    expect(await screen.findByText('Excellent')).toBeInTheDocument();
  });
});
