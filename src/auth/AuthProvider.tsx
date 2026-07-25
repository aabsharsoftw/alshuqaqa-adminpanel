import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ApiError, UNAUTHORIZED_EVENT, api, tokenStore } from '../lib/api';
import type { User } from '../lib/types';
import { AuthContext } from './context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    const hadToken = Boolean(tokenStore.get());
    tokenStore.clear();
    setUser(null);
    // Fire-and-forget: the server-side call is a courtesy, JWTs are stateless.
    if (hadToken) void api.logout().catch(() => {});
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      tokenStore.clear();
      setUser(null);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    let active = true;
    api
      .me()
      .then((me) => {
        if (!active) return;
        if (me.role === 'ADMIN') {
          setUser(me);
        } else {
          tokenStore.clear();
        }
      })
      .catch(() => tokenStore.clear())
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login(email, password);
    if (result.user.role !== 'ADMIN') {
      throw new ApiError(403, 'This portal is restricted to administrators.');
    }
    tokenStore.set(result.accessToken);
    setUser(result.user);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
