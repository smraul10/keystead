import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the welcome heading', () => {
    // Arrange: render the component in the simulated browser
    render(<App />);

    // Assert: find the heading by role, as a user would
    const heading = screen.getByRole('heading', {
      name: 'Welcome to Keystead',
    });
    expect(heading).toBeInTheDocument();
  });
});
