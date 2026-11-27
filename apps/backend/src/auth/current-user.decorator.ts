import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { CurrentUser } from '@roamind/shared';

export const CurrentUserParam = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUser => {
    const request = context.switchToHttp().getRequest<{ user: CurrentUser }>();
    return request.user;
  },
);
