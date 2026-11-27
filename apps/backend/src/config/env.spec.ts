import { describe, expect, it } from 'vitest';
import { envSchema } from './env.js';

const PORT_REQUIRED_MESSAGE = 'PORT is required';
const PORT_INVALID_MESSAGE = 'PORT must be a positive integer';
const NEON_CONNECTION_STRING_REQUIRED_MESSAGE = 'NEON_CONNECTION_STRING is required';
const JWT_SECRET_REQUIRED_MESSAGE = 'JWT_SECRET is required';
const ALLOW_SIGNUP_REQUIRED_MESSAGE = 'ALLOW_SIGNUP is required';
const ALLOW_SIGNUP_INVALID_MESSAGE = 'ALLOW_SIGNUP must be true or false';
const CONNECTION_STRING = 'postgres://localhost/roamind';
const JWT_SECRET = 'test-secret';
const ALLOW_SIGNUP_ENABLED = 'true';
const ALLOW_SIGNUP_DISABLED = 'false';
const OPEN_UNCENSORED_API_KEY = 'test-key';
const OPEN_UNCENSORED_MODEL = 'test-model';
const OPEN_UNCENSORED_API_KEY_REQUIRED_MESSAGE = 'OPEN_UNCENSORED_API_KEY is required';
const OPEN_UNCENSORED_MODEL_REQUIRED_MESSAGE = 'OPEN_UNCENSORED_MODEL is required';

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

  it('rejects a missing JWT_SECRET', () => {
    const result = envSchema.safeParse({
      PORT: '8080',
      NEON_CONNECTION_STRING: CONNECTION_STRING,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(JWT_SECRET_REQUIRED_MESSAGE);
    }
  });

  it('rejects a missing ALLOW_SIGNUP', () => {
    const result = envSchema.safeParse({
      PORT: '8080',
      NEON_CONNECTION_STRING: CONNECTION_STRING,
      JWT_SECRET,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(ALLOW_SIGNUP_REQUIRED_MESSAGE);
    }
  });

  it('rejects an invalid ALLOW_SIGNUP', () => {
    const result = envSchema.safeParse({
      PORT: '8080',
      NEON_CONNECTION_STRING: CONNECTION_STRING,
      JWT_SECRET,
      ALLOW_SIGNUP: 'yes',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(ALLOW_SIGNUP_INVALID_MESSAGE);
    }
  });

  it('rejects a missing OPEN_UNCENSORED_API_KEY', () => {
    const result = envSchema.safeParse({
      PORT: '8080',
      NEON_CONNECTION_STRING: CONNECTION_STRING,
      JWT_SECRET,
      ALLOW_SIGNUP: ALLOW_SIGNUP_ENABLED,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(OPEN_UNCENSORED_API_KEY_REQUIRED_MESSAGE);
    }
  });

  it('rejects a missing OPEN_UNCENSORED_MODEL', () => {
    const result = envSchema.safeParse({
      PORT: '8080',
      NEON_CONNECTION_STRING: CONNECTION_STRING,
      JWT_SECRET,
      ALLOW_SIGNUP: ALLOW_SIGNUP_ENABLED,
      OPEN_UNCENSORED_API_KEY,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(OPEN_UNCENSORED_MODEL_REQUIRED_MESSAGE);
    }
  });

  it('parses ALLOW_SIGNUP into a boolean', () => {
    const result = envSchema.safeParse({
      PORT: '8080',
      NEON_CONNECTION_STRING: CONNECTION_STRING,
      JWT_SECRET,
      ALLOW_SIGNUP: ALLOW_SIGNUP_DISABLED,
      OPEN_UNCENSORED_API_KEY,
      OPEN_UNCENSORED_MODEL,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ALLOW_SIGNUP).toBe(false);
    }
  });

  it('parses PORT into a number', () => {
    const port = '8080';
    const result = envSchema.safeParse({
      PORT: port,
      NEON_CONNECTION_STRING: CONNECTION_STRING,
      JWT_SECRET,
      ALLOW_SIGNUP: ALLOW_SIGNUP_ENABLED,
      OPEN_UNCENSORED_API_KEY,
      OPEN_UNCENSORED_MODEL,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(Number(port));
    }
  });
});
