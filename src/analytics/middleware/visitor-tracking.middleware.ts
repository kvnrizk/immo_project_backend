import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';

@Injectable()
export class VisitorTrackingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(VisitorTrackingMiddleware.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip tracking for certain paths
    const skipPaths = ['/health', '/api/analytics', '/favicon.ico', '/assets'];
    const shouldSkip = skipPaths.some((path) => req.path.startsWith(path));

    if (!shouldSkip && req.method === 'GET') {
      // Get client IP (handle proxies)
      const ip =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
        (req.headers['x-real-ip'] as string) ||
        req.socket.remoteAddress ||
        'unknown';

      const userAgent = req.headers['user-agent'] || 'unknown';
      const page = req.path || '/';

      // Track visit asynchronously (don't block the request)
      this.analyticsService.trackVisit(ip, userAgent, page).catch((error) => {
        this.logger.error(`Failed to track visit: ${error.message}`);
      });
    }

    next();
  }
}
