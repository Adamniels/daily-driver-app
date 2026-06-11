/**
 * The vanilla tRPC client. `EXPO_PUBLIC_API_URL` is inlined by Expo at
 * bundle time; the default targets the local API (simulator and web reach
 * the Mac's localhost — a physical device needs the LAN address).
 */
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@habit/api';
import { tokenStorage } from './tokenStorage';

export const apiUrl =
  (process.env.EXPO_PUBLIC_API_URL as string | undefined) ?? 'http://localhost:3001';

export type ApiClient = ReturnType<typeof createTRPCClient<AppRouter>>;

export function createApiClient(): ApiClient {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${apiUrl}/trpc`,
        async headers() {
          const token = await tokenStorage.get();
          return token ? { authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}
