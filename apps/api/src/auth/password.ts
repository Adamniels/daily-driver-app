import { hash, verify } from '@node-rs/argon2';

/**
 * Algorithm.Argon2id from @node-rs/argon2 — referenced by value because the
 * package ships it as an ambient const enum, which verbatimModuleSyntax
 * (correctly) refuses to import at runtime.
 */
const ARGON2ID = 2;
const OPTIONS = { algorithm: ARGON2ID };

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password, OPTIONS);
  } catch {
    return false;
  }
}
