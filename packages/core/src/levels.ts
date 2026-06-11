/**
 * Level curve: going from level n to n+1 costs round(100 × n^1.3) XP.
 * Early levels come fast (1→2 is 100 XP), later ones take commitment.
 * Levels are unbounded; level and total XP only ever grow because the
 * XP ledger is append only.
 */

export interface LevelInfo {
  level: number;
  /** XP earned inside the current level. */
  xpIntoLevel: number;
  /** XP needed to finish the current level. */
  xpForNextLevel: number;
  /** xpIntoLevel / xpForNextLevel, in [0, 1). */
  progress: number;
}

/** XP required to go from `level` to `level + 1`. */
export function xpRequiredForLevel(level: number): number {
  if (!Number.isInteger(level) || level < 1) {
    throw new RangeError(`level must be a positive integer, got ${level}`);
  }
  return Math.round(100 * level ** 1.3);
}

/** Resolve total ledger XP into a level and progress toward the next one. */
export function levelFromTotalXp(totalXp: number): LevelInfo {
  let remaining = Math.max(0, Math.floor(totalXp));
  let level = 1;
  for (;;) {
    const required = xpRequiredForLevel(level);
    if (remaining < required) {
      return {
        level,
        xpIntoLevel: remaining,
        xpForNextLevel: required,
        progress: remaining / required,
      };
    }
    remaining -= required;
    level += 1;
  }
}
