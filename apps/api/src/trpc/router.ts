import { router } from './trpc.js';
import { authRouter } from './routers/auth.js';
import { completionsRouter } from './routers/completions.js';
import { creatureRouter } from './routers/creature.js';
import { habitsRouter } from './routers/habits.js';
import { statsRouter } from './routers/stats.js';
import { tasksRouter } from './routers/tasks.js';

export const appRouter = router({
  auth: authRouter,
  habits: habitsRouter,
  completions: completionsRouter,
  tasks: tasksRouter,
  stats: statsRouter,
  creature: creatureRouter,
});

/** The app imports only this type — the compile time API contract. */
export type AppRouter = typeof appRouter;
