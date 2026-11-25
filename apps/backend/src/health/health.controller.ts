import { Controller, Get } from '@nestjs/common';

const HEALTH_STATUS_OK = 'ok';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): { status: typeof HEALTH_STATUS_OK } {
    return { status: HEALTH_STATUS_OK };
  }
}
