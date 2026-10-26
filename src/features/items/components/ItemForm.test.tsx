import { mockIPC } from '@tauri-apps/api/mocks';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { loadEstimator } from '@/features/strength';
import { EMPTY_ITEM_VALUES, type ItemFormValues } from '../itemSchema';
import { ItemForm } from './ItemForm';

// A 1×1 PNG, in base64
const ICON =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

function renderForm(defaultValues: ItemFormValues = EMPTY_ITEM_VALUES) {
  const actions = { onSubmit: vi.fn(), onCancel: vi.fn() };
  render(
    <ItemForm heading='New item' defaultValues={defaultValues} {...actions} />,
  );
  return actions;
}

describe('ItemForm', () => {
  // The strength dictionaries are big: load them once, before the tests
  beforeAll(async () => {
    await loadEstimator();
  });

  it('shows how strong the password is', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Password'), 'password1234');

    expect(await screen.findByText('Poor')).toBeInTheDocument();
  });

  it('submits the typed values', async () => {
    // Arrange
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    // Act
    await user.type(screen.getByLabelText('Title'), 'Netflix');
    await user.type(screen.getByLabelText('Username'), 'raul@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.type(screen.getByLabelText('Website'), 'netflix.com');
    await user.type(screen.getByLabelText('Notes'), 'Family plan');
    await user.click(screen.getByRole('checkbox', { name: 'Favorite' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    // Assert: submitting is asynchronous (validation runs first)
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Netflix',
        username: 'raul@example.com',
        password: 'secret',
        url: 'netflix.com',
        notes: 'Family plan',
        favorite: true,
        icon: null,
      }),
    );
  });

  it('saves the cleaned values', async () => {
    // Arrange
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    // Act
    await user.type(screen.getByLabelText('Title'), '  Netflix  ');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    // Assert: the schema trims the title before it is saved
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Netflix' }),
      ),
    );
  });

  it('explains what is wrong with the title', async () => {
    // Arrange
    const user = userEvent.setup();
    const { onSubmit } = renderForm();

    // Act: save without a title
    await user.click(screen.getByRole('button', { name: 'Save' }));

    // Assert: the error is linked to the field, so screen readers read it
    const title = screen.getByLabelText('Title');
    await waitFor(() => expect(title).toHaveAttribute('aria-invalid', 'true'));
    expect(title).toHaveAccessibleDescription('Enter a title');
    expect(title).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('starts with the given values', () => {
    renderForm({ ...EMPTY_ITEM_VALUES, title: 'GitHub', favorite: true });

    expect(screen.getByLabelText('Title')).toHaveValue('GitHub');
    expect(screen.getByRole('checkbox', { name: 'Favorite' })).toBeChecked();
  });

  it('hides the password until asked', async () => {
    // Arrange
    const user = userEvent.setup();
    renderForm();
    const password = screen.getByLabelText('Password');
    expect(password).toHaveAttribute('type', 'password');

    // Act
    await user.click(screen.getByRole('button', { name: 'Show password' }));

    // Assert
    expect(password).toHaveAttribute('type', 'text');
  });

  it('cancels without saving', async () => {
    // Arrange
    const user = userEvent.setup();
    const { onSubmit, onCancel } = renderForm();
    await user.type(screen.getByLabelText('Title'), 'Netflix');

    // Act
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    // Assert
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('cancels with Esc', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderForm();

    // The title has the focus when the form opens
    await user.keyboard('{Escape}');

    expect(onCancel).toHaveBeenCalledOnce();
  });

  describe('password generator', () => {
    it('fills the password from the generator', async () => {
      // Arrange: open the generator and read the password it shows
      const user = userEvent.setup();
      renderForm();
      await user.click(
        screen.getByRole('button', { name: 'Generate password' }),
      );
      const dialog = screen.getByRole('dialog', { name: 'Generate password' });
      const generated =
        within(dialog).getByRole('status', { name: 'Generated password' })
          .textContent ?? '';

      // Act
      await user.click(
        within(dialog).getByRole('button', { name: 'Use password' }),
      );

      // Assert: the dialog is closed and the password is in the field, shown
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      const password = screen.getByLabelText('Password');
      expect(password).toHaveValue(generated);
      expect(password).toHaveAttribute('type', 'text');
    });

    it('closes the generator without changing the password', async () => {
      // Arrange
      const user = userEvent.setup();
      renderForm({ ...EMPTY_ITEM_VALUES, password: 'old-password' });
      await user.click(
        screen.getByRole('button', { name: 'Generate password' }),
      );

      // Act
      await user.click(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: 'Close',
        }),
      );

      // Assert
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toHaveValue('old-password');
    });
  });

  it("downloads the website's icon and saves it", async () => {
    // Arrange
    const user = userEvent.setup();
    mockIPC((command) => (command === 'download_icon' ? ICON : undefined));
    const { onSubmit } = renderForm({
      ...EMPTY_ITEM_VALUES,
      title: 'GitHub',
      url: 'github.com',
    });

    // Act
    await user.click(
      screen.getByRole('button', { name: 'Download from website' }),
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));

    // Assert
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ icon: ICON }),
      ),
    );
  });

  it('needs a website to download its icon', () => {
    renderForm();

    expect(
      screen.getByRole('button', { name: 'Download from website' }),
    ).toBeDisabled();
  });

  it('explains why the icon could not be downloaded', async () => {
    // Arrange: the website has no favicon.ico
    const user = userEvent.setup();
    mockIPC(() => Promise.reject({ kind: 'iconNotFound' }));
    renderForm({ ...EMPTY_ITEM_VALUES, url: 'example.com' });

    // Act
    await user.click(
      screen.getByRole('button', { name: 'Download from website' }),
    );

    // Assert
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'no icon Keystead can use',
    );
  });

  it('removes the icon', async () => {
    // Arrange
    const user = userEvent.setup();
    const { onSubmit } = renderForm({
      ...EMPTY_ITEM_VALUES,
      title: 'GitHub',
      icon: ICON,
    });

    // Act
    await user.click(screen.getByRole('button', { name: 'Remove' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    // Assert
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ icon: null }),
      ),
    );
  });
});
