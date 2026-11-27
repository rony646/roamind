import { Controller, Get } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { Public } from '../auth/public.decorator.js';
import { DatabaseService } from '../database/database.service.js';

const HEALTH_STATUS_OK = 'ok';

@Controller('health')
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Public()
  @Get()
  async getHealth(): Promise<{ status: typeof HEALTH_STATUS_OK }> {
    await this.database.client.execute(sql`select 1`);
    return { status: HEALTH_STATUS_OK };
  }
}
