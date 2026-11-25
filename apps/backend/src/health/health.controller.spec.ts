import { describe, expect, it, vi } from 'vitest';
import type { DatabaseService } from '../database/database.service.js';
import { HealthController } from './health.controller.js';

function createDatabase(execute: () => Promise<unknown>): DatabaseService {
  return {
    client: { execute },
  } as unknown as DatabaseService;
}

describe('HealthController', () => {
  it('returns ok when the database answers', async () => {
    const execute = vi.fn().mockResolvedValue([]);
    const controller = new HealthController(createDatabase(execute));

    await expect(controller.getHealth()).resolves.toEqual({ status: 'ok' });
    expect(execute).toHaveBeenCalledOnce();
  });

  it('fails when the database is unreachable', async () => {
    const controller = new HealthController(
      createDatabase(() => Promise.reject(new Error('connect ECONNREFUSED'))),
    );

    await expect(controller.getHealth()).rejects.toThrow('connect ECONNREFUSED');
  });
});
