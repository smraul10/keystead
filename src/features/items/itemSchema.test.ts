import { describe, expect, it } from 'vitest';
import { type ItemFormValues, itemSchema, toFormValues } from './itemSchema';
import { makeItem } from './makeItem';

const VALID: ItemFormValues = {
  title: 'GitHub',
  username: 'raul-dev',
  password: 'b,YjHm4^9aBBNC[zP]GD',
  url: 'https://github.com',
  notes: 'Recovery codes are in the safe.',
  favorite: false,
  icon: null,
};

// The first error message for a field, or undefined if the field is valid
function errorFor(values: ItemFormValues, field: keyof ItemFormValues) {
  const result = itemSchema.safeParse(values);
  return result.error?.issues.find((issue) => issue.path[0] === field)?.message;
}

describe('itemSchema', () => {
  it('accepts a complete item', () => {
    expect(itemSchema.safeParse(VALID).success).toBe(true);
  });

  it('accepts an item with only a title', () => {
    const values = {
      ...VALID,
      username: '',
      password: '',
      url: '',
      notes: '',
    };

    expect(itemSchema.safeParse(values).success).toBe(true);
  });

  it('requires a title', () => {
    expect(errorFor({ ...VALID, title: '' }, 'title')).toBe('Enter a title');
  });

  it('does not accept a title made only of spaces', () => {
    expect(errorFor({ ...VALID, title: '   ' }, 'title')).toBe('Enter a title');
  });

  it('limits the length of the title', () => {
    expect(errorFor({ ...VALID, title: 'a'.repeat(201) }, 'title')).toBe(
      'Use 200 characters or fewer',
    );
  });

  it('trims spaces around the title, username and website', () => {
    const values = {
      ...VALID,
      title: '  GitHub  ',
      username: ' raul-dev ',
      url: ' https://github.com ',
    };

    expect(itemSchema.parse(values)).toMatchObject({
      title: 'GitHub',
      username: 'raul-dev',
      url: 'https://github.com',
    });
  });

  it('keeps spaces in the password', () => {
    // A space can be part of a password: never change what the user typed
    const values = { ...VALID, password: ' secret ' };

    expect(itemSchema.parse(values).password).toBe(' secret ');
  });
});

describe('toFormValues', () => {
  it('takes only the form fields from an item', () => {
    const item = makeItem({ ...VALID, id: '1', deletedAt: null });

    expect(toFormValues(item)).toEqual(VALID);
  });
});
