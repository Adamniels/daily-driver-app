import type { RouterOutputs } from '@/lib/trpc';

export type TasksList = RouterOutputs['tasks']['list'];
export type TaskItem = TasksList['open'][number];
