import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EMPTY_ITEM_VALUES, type ItemFormValues } from '../itemSchema';
import { ItemForm } from './ItemForm';

function renderForm(defaultValues: ItemFormValues = EMPTY_ITEM_VALUES) {
  const actions = { onSubmit: vi.fn(), onCancel: vi.fn() };
  render(
    <ItemForm heading='New item' defaultValues={defaultValues} {...actions} />,
  );
  return actions;
}

describe('ItemForm', () => {
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
});
