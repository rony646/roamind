import { z } from 'zod';

const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
const PORT_REQUIRED_MESSAGE = 'PORT is required';
const PORT_INVALID_MESSAGE = 'PORT must be a positive integer';

export const envSchema = z.object({
  PORT: z
    .string({
      error: (issue) => (issue.input === undefined ? PORT_REQUIRED_MESSAGE : PORT_INVALID_MESSAGE),
    })
    .regex(POSITIVE_INTEGER_PATTERN, { error: PORT_INVALID_MESSAGE })
    .transform(Number),
});

export type Env = z.infer<typeof envSchema>;
