import { describe, expect, it } from 'vitest';
import { CORE_VERSION } from './index.js';

describe('@habit/core scaffold', () => {
  it('exports the version marker', () => {
    expect(CORE_VERSION).toBe('0.1.0');
  });
});
