import { Suspense, use, useDeferredValue, useMemo } from 'react';
import { loadedEstimator, loadEstimator } from './estimator';
import { StrengthBadge } from './StrengthBadge';

interface PasswordStrengthProps {
  password: string;
}

// How strong a typed password is, while it is being typed
export function PasswordStrength({ password }: PasswordStrengthProps) {
  // Measuring takes a few milliseconds: what is typed shows first, and the
  // badge follows with a lower priority
  const deferredPassword = useDeferredValue(password);

  if (deferredPassword === '') {
    return null;
  }

  // Nothing is shown until the dictionaries load (only the first time)
  return (
    <Suspense fallback={null}>
      <EstimatedStrength password={deferredPassword} />
    </Suspense>
  );
}

function EstimatedStrength({ password }: PasswordStrengthProps) {
  // Only the first time: `use` waits for the dictionaries (React shows the
  // fallback meanwhile). Unlike a hook, `use` may be called conditionally
  const estimateBits = loadedEstimator() ?? use(loadEstimator());
  // Measured again only when the password changes, not when another field
  // of the form does
  const bits = useMemo(() => estimateBits(password), [estimateBits, password]);

  return <StrengthBadge bits={bits} />;
}
