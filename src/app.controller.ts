import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AnalyticsService } from './analytics/services/analytics.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    return this.analyticsService.getHealthCheck();
  }
}
