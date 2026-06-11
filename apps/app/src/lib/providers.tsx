/** Provider stack: TanStack Query → tRPC → Auth → Toast. */
import { useState } from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';
import { createApiClient } from './api';
import { AuthProvider } from './auth';
import { TRPCProvider } from './trpc';
import { ToastProvider } from '@/components/Toast';

function shouldRetry(failureCount: number, error: unknown): boolean {
  // Auth and validation failures won't fix themselves by retrying.
  if (error instanceof TRPCClientError) {
    const code = (error.data as { code?: string } | undefined)?.code;
    if (code === 'UNAUTHORIZED' || code === 'FORBIDDEN' || code === 'BAD_REQUEST') return false;
  }
  return failureCount < 2;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: shouldRetry, staleTime: 30_000 },
          mutations: { retry: false },
        },
      }),
  );
  const [trpcClient] = useState(() => createApiClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </TRPCProvider>
    </QueryClientProvider>
  );
}
