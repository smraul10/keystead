import { useState } from 'react';
import { DEFAULT_PASSWORD_OPTIONS, generatePassword } from './generatePassword';

export function PasswordGenerator() {
  const [password, setPassword] = useState(() =>
    generatePassword(DEFAULT_PASSWORD_OPTIONS),
  );

  return (
    <div>
      <input readOnly aria-label='Generated password' value={password} />
      <button
        type='button'
        aria-label='Regenerate password'
        title='Regenerate password'
        onClick={() => setPassword(generatePassword(DEFAULT_PASSWORD_OPTIONS))}
      >
        ↻
      </button>
    </div>
  );
}
