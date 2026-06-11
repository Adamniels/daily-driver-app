/**
 * tRPC wiring. `AppRouter` is imported as a type only — the compile time
 * contract with the API (invariant 4). No response types are written by hand.
 */
import { createTRPCContext } from '@trpc/tanstack-react-query';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@habit/api';

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

export type RouterOutputs = inferRouterOutputs<AppRouter>;

/** A row from habits.list — carries streaks, completedToday and weekCount. */
export type HabitRow = RouterOutputs['habits']['list'][number];
/** The celebration payload from completions.toggle. */
export type ToggleResult = RouterOutputs['completions']['toggle'];
export type CreatureInfo = RouterOutputs['creature']['get'];
export type AuthedUser = RouterOutputs['auth']['me'];
