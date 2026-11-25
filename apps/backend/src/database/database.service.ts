import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { Env } from '../config/env.js';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;
  readonly client: NodePgDatabase;

  constructor(config: ConfigService<Env, true>) {
    this.pool = new Pool({
      connectionString: config.get('NEON_CONNECTION_STRING', { infer: true }),
    });
    this.client = drizzle(this.pool);
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
