import { describe, expect, it } from 'vitest';
import { envSchema } from './env.js';

const PORT_REQUIRED_MESSAGE = 'PORT is required';
const PORT_INVALID_MESSAGE = 'PORT must be a positive integer';
const NEON_CONNECTION_STRING_REQUIRED_MESSAGE = 'NEON_CONNECTION_STRING is required';
const CONNECTION_STRING = 'postgres://localhost/roamind';

describe('envSchema', () => {
  it('rejects a missing PORT', () => {
    const result = envSchema.safeParse({ NEON_CONNECTION_STRING: CONNECTION_STRING });

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

  it('rejects a missing NEON_CONNECTION_STRING', () => {
    const result = envSchema.safeParse({ PORT: '8080' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(NEON_CONNECTION_STRING_REQUIRED_MESSAGE);
    }
  });

  it('parses PORT into a number', () => {
    const port = '8080';
    const result = envSchema.safeParse({
      PORT: port,
      NEON_CONNECTION_STRING: CONNECTION_STRING,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(Number(port));
    }
  });
});
