import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

const handler = () => undefined;

class PublicController {}

function createContext(): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => PublicController,
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  it('skips authentication on a public route', () => {
    const getAllAndOverride = vi.fn().mockReturnValue(true);
    const guard = new JwtAuthGuard({ getAllAndOverride } as unknown as Reflector);

    expect(guard.canActivate(createContext())).toBe(true);
    expect(getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [handler, PublicController]);
  });
});
