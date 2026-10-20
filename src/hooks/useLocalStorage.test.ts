import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  it('returns the default value when nothing is stored', () => {
    // Act
    const { result } = renderHook(() => useLocalStorage('key', 'default'));

    // Assert
    expect(result.current[0]).toBe('default');
  });

  it('stores the new value', () => {
    // Arrange
    const { result } = renderHook(() => useLocalStorage('key', 'default'));

    // Act
    act(() => result.current[1]('new'));

    // Assert
    expect(result.current[0]).toBe('new');
    expect(localStorage.getItem('key')).toBe(JSON.stringify('new'));
  });

  it('returns the stored value', () => {
    // Arrange: a value saved in a previous session
    localStorage.setItem('key', JSON.stringify('stored'));

    // Act
    const { result } = renderHook(() => useLocalStorage('key', 'default'));

    // Assert
    expect(result.current[0]).toBe('stored');
  });

  it('falls back to the default value when the stored value is not valid JSON', () => {
    // Arrange: corrupted data
    localStorage.setItem('key', '{not json');

    // Act
    const { result } = renderHook(() => useLocalStorage('key', 'default'));

    // Assert
    expect(result.current[0]).toBe('default');
  });

  it('stores objects', () => {
    // Arrange
    const { result } = renderHook(() => useLocalStorage('key', { length: 20 }));

    // Act
    act(() => result.current[1]({ length: 32 }));

    // Assert
    expect(localStorage.getItem('key')).toBe(JSON.stringify({ length: 32 }));
  });
});
