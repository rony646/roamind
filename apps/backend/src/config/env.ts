import { z } from 'zod';

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
const PORT_REQUIRED_MESSAGE = 'PORT is required';
const PORT_INVALID_MESSAGE = 'PORT must be a positive integer';
const NEON_CONNECTION_STRING_REQUIRED_MESSAGE = 'NEON_CONNECTION_STRING is required';
const JWT_SECRET_REQUIRED_MESSAGE = 'JWT_SECRET is required';

export const envSchema = z.object({
  PORT: z
    .string({
      error: (issue) => (issue.input === undefined ? PORT_REQUIRED_MESSAGE : PORT_INVALID_MESSAGE),
    })
    .regex(POSITIVE_INTEGER_PATTERN, { error: PORT_INVALID_MESSAGE })
    .transform(Number),
  NEON_CONNECTION_STRING: z
    .string({
      error: (issue) =>
        issue.input === undefined ? NEON_CONNECTION_STRING_REQUIRED_MESSAGE : undefined,
    })
    .min(1, { error: NEON_CONNECTION_STRING_REQUIRED_MESSAGE }),
  JWT_SECRET: z
    .string({
      error: (issue) => (issue.input === undefined ? JWT_SECRET_REQUIRED_MESSAGE : undefined),
    })
    .min(1, { error: JWT_SECRET_REQUIRED_MESSAGE }),
});

export type Env = z.infer<typeof envSchema>;
