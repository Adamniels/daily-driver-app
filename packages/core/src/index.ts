/**
 * @habit/core — pure gamification domain logic.
 *
 * Invariants (see docs/phase-2-core-engine.md):
 * - pure functions only: no I/O, no wall clock, no randomness
 * - day level logic uses user local 'YYYY-MM-DD' strings passed in by callers
 * - zero runtime dependencies
 * - level, streaks, stage and mood are always derived, never stored
 */
export * from './types.js';
export * from './dates.js';
export * from './levels.js';
export * from './schedule.js';
export * from './streaks.js';
export * from './xp.js';
export * from './creature.js';
export * from './heatmap.js';
