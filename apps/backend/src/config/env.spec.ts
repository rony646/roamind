import { describe, expect, it } from 'vitest';
import { envSchema } from './env.js';

const PORT_REQUIRED_MESSAGE = 'PORT is required';
const PORT_INVALID_MESSAGE = 'PORT must be a positive integer';

describe('envSchema', () => {
  it('rejects a missing PORT', () => {
    const result = envSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(PORT_REQUIRED_MESSAGE);
    }
  });

  it('rejects a PORT that is not a positive integer', () => {
    const result = envSchema.safeParse({ PORT: '0' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(PORT_INVALID_MESSAGE);
    }
  });

  it('parses PORT into a number', () => {
    const port = '8080';
    const result = envSchema.safeParse({ PORT: port });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(Number(port));
    }
  });
});
