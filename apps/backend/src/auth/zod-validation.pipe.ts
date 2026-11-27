import { BadRequestException, type PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

const INVALID_REQUEST_BODY_MESSAGE = 'Invalid request body';

type FieldIssue = {
  path: string;
  message: string;
};

export class ZodValidationPipe<T extends ZodType> implements PipeTransform<unknown, T['_output']> {
  constructor(private readonly schema: T) {}

  transform(value: unknown): T['_output'] {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const issues: FieldIssue[] = result.error.issues.map((issue) => ({
        path: issue.path.map(String).join('.'),
        message: issue.message,
      }));
      throw new BadRequestException({
        message: INVALID_REQUEST_BODY_MESSAGE,
        issues,
      });
    }

    return result.data;
  }
}
