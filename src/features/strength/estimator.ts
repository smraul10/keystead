type Estimator = (password: string) => number;

// The dictionaries weigh a few MB: they are loaded the first time a strength
// is needed, from a file of their own, not when the app starts
let estimator: Promise<Estimator> | undefined;
let loaded: Estimator | undefined;

/** The password strength estimator (see zxcvbn.ts), loaded only once. */
export function loadEstimator(): Promise<Estimator> {
  estimator ??= import('./zxcvbn').then((module) => {
    loaded = module.estimateBits;
    return loaded;
  });
  return estimator;
}

/** The estimator, if it has been loaded already; `undefined` before. */
export function loadedEstimator(): Estimator | undefined {
  return loaded;
}
