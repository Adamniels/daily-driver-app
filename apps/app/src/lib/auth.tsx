/**
 * Auth state: token persisted via tokenStorage, user kept in memory.
 * On launch a stored token is validated against auth.me — an UNAUTHORIZED
 * answer clears it, a network error keeps it (the API may just be down;
 * queries will surface their own errors).
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { TRPCClientError } from '@trpc/client';
import { useQueryClient } from '@tanstack/react-query';
import type { RegisterInput } from '@habit/shared';
import { createApiClient } from './api';
import { tokenStorage } from './tokenStorage';
import type { AuthedUser } from './trpc';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthedUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isUnauthorized(error: unknown): boolean {
  if (!(error instanceof TRPCClientError)) return false;
  return (error.data as { code?: string } | undefined)?.code === 'UNAUTHORIZED';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthedUser | null>(null);
  const queryClient = useQueryClient();
  const client = useMemo(() => createApiClient(), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = await tokenStorage.get();
      if (!token) {
        if (!cancelled) setStatus('signedOut');
        return;
      }
      try {
        const me = await client.auth.me.query();
        if (!cancelled) {
          setUser(me);
          setStatus('signedIn');
        }
      } catch (error) {
        if (cancelled) return;
        if (isUnauthorized(error)) {
          await tokenStorage.clear();
          setStatus('signedOut');
        } else {
          // Network trouble: trust the stored token, let queries retry.
          setStatus('signedIn');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      async login(email, password) {
        const result = await client.auth.login.mutate({ email, password });
        await tokenStorage.set(result.token);
        setUser(result.user);
        setStatus('signedIn');
      },
      async register(input) {
        const result = await client.auth.register.mutate(input);
        await tokenStorage.set(result.token);
        setUser(result.user);
        setStatus('signedIn');
      },
      async signOut() {
        await tokenStorage.clear();
        queryClient.clear();
        setUser(null);
        setStatus('signedOut');
      },
    }),
    [status, user, client, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
