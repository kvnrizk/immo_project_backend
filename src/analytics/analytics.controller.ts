import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AnalyticsService } from './services/analytics.service';
import { TrackVisitDto } from './dto/track-visit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Public endpoint to track page views from frontend
   */
  @Post('track')
  async trackPageView(@Body() trackVisitDto: TrackVisitDto, @Req() req: Request) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      'unknown';

    const userAgent = req.headers['user-agent'] || 'unknown';

    await this.analyticsService.trackVisit(ip, userAgent, trackVisitDto.page);

    return { success: true };
  }

  /**
   * Protected endpoint to get analytics data (admin only)
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getAnalytics() {
    return this.analyticsService.getAnalytics();
  }

  /**
   * Public health check endpoint
   */
  @Get('/health')
  async getHealth() {
    return this.analyticsService.getHealthCheck();
  }
}
