import { describe, expect, it } from 'vitest';
import { signToken, verifyToken } from './jwt.js';

const SECRET = 'test-secret-at-least-8-chars';

describe('jwt', () => {
  it('roundtrips a user id', async () => {
    const token = await signToken('user-123', SECRET);
    expect(await verifyToken(token, SECRET)).toBe('user-123');
  });

  it('rejects a token signed with another secret', async () => {
    const token = await signToken('user-123', 'some-other-secret');
    expect(await verifyToken(token, SECRET)).toBeNull();
  });

  it('rejects garbage', async () => {
    expect(await verifyToken('not.a.token', SECRET)).toBeNull();
    expect(await verifyToken('', SECRET)).toBeNull();
  });
});
