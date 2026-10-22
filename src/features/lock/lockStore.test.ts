import { beforeEach, describe, expect, it } from 'vitest';
import { DEMO_MASTER_PASSWORD, useLockStore } from './lockStore';

describe('lockStore', () => {
  // The store lives outside React and survives between tests: reset it
  beforeEach(() => {
    useLockStore.setState({ locked: true });
  });

  it('starts locked', () => {
    expect(useLockStore.getInitialState().locked).toBe(true);
  });

  it('unlocks with the right master password', async () => {
    const unlocked = await useLockStore.getState().unlock(DEMO_MASTER_PASSWORD);

    expect(unlocked).toBe(true);
    expect(useLockStore.getState().locked).toBe(false);
  });

  it('stays locked with a wrong master password', async () => {
    const unlocked = await useLockStore.getState().unlock('wrong');

    expect(unlocked).toBe(false);
    expect(useLockStore.getState().locked).toBe(true);
  });

  it('locks again', () => {
    useLockStore.setState({ locked: false });

    useLockStore.getState().lock();

    expect(useLockStore.getState().locked).toBe(true);
  });
});
