import { Suspense, use } from 'react';
import { loadedEstimator, loadEstimator } from './estimator';
import { StrengthBadge } from './StrengthBadge';

interface PasswordStrengthProps {
  password: string;
}

// How strong a typed password is, while it is being typed
export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (password === '') {
    return null;
  }

  // Nothing is shown until the dictionaries load (only the first time)
  return (
    <Suspense fallback={null}>
      <EstimatedStrength password={password} />
    </Suspense>
  );
}

function EstimatedStrength({ password }: PasswordStrengthProps) {
  // Only the first time: `use` waits for the dictionaries (React shows the
  // fallback meanwhile). Unlike a hook, `use` may be called conditionally
  const estimateBits = loadedEstimator() ?? use(loadEstimator());

  return <StrengthBadge bits={estimateBits(password)} />;
}
