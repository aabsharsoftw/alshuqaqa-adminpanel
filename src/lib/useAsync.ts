import { useCallback, useEffect, useState } from 'react';
import { ApiError } from './api';

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong.';
}

/**
 * Runs `fn` whenever `deps` change, discarding results from superseded runs so
 * a slow earlier request cannot overwrite a newer one.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  // Callers declare their own dependencies, so `fn` itself is deliberately not
  // tracked — re-running is driven by `deps` and `reload()` only.
  // oxlint-disable-next-line exhaustive-deps
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fn()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err: unknown) => {
        if (active) setError(errorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // oxlint-disable-next-line exhaustive-deps
  }, deps.concat(nonce));

  return { data, loading, error, reload, setData };
}
