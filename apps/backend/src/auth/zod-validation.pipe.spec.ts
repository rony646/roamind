import { BadRequestException } from '@nestjs/common';
import { loginBodySchema, registerBodySchema } from '@roamind/shared';
import { describe, expect, it } from 'vitest';
import { ZodValidationPipe } from './zod-validation.pipe.js';

const NAME = 'Ada Lovelace';
const EMAIL = 'ada@example.com';
const PASSWORD = 'password1';
const SHORT_PASSWORD = 'short';

describe('ZodValidationPipe', () => {
  it('returns the parsed register body', () => {
    const pipe = new ZodValidationPipe(registerBodySchema);

    expect(pipe.transform({ name: `  ${NAME}  `, email: EMAIL, password: PASSWORD })).toEqual({
      name: NAME,
      email: EMAIL,
      password: PASSWORD,
    });
  });

  it('rejects a password shorter than the minimum', () => {
    const pipe = new ZodValidationPipe(registerBodySchema);

    expect(() => pipe.transform({ name: NAME, email: EMAIL, password: SHORT_PASSWORD })).toThrow(
      BadRequestException,
    );
  });

  it('rejects an invalid login body', () => {
    const pipe = new ZodValidationPipe(loginBodySchema);

    expect(() => pipe.transform({})).toThrow(BadRequestException);
  });
});
