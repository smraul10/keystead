import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ItemAvatar } from './ItemAvatar';

// A 1×1 PNG, in base64
const ICON =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

describe('ItemAvatar', () => {
  // The avatar is decorative (aria-hidden): look inside the DOM directly
  it("shows the site's icon when the item has one", () => {
    const { container } = render(<ItemAvatar title='GitHub' icon={ICON} />);

    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      `data:image/png;base64,${ICON}`,
    );
    expect(container).not.toHaveTextContent('G');
  });

  it('shows the initial of the title otherwise', () => {
    const { container } = render(<ItemAvatar title='GitHub' icon={null} />);

    expect(container.querySelector('img')).toBeNull();
    expect(container).toHaveTextContent('G');
  });
});
