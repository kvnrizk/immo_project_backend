import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Visitor } from '../entities/visitor.entity';
import { GeolocationService } from './geolocation.service';
import * as os from 'os';

export interface VisitorStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export interface CountryStats {
  country: string;
  count: number;
}

export interface DailyVisitor {
  date: string;
  count: number;
}

export interface PageView {
  page: string;
  count: number;
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  database: 'connected' | 'disconnected';
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
  timestamp: string;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly startTime = Date.now();

  constructor(
    @InjectRepository(Visitor)
    private visitorRepository: Repository<Visitor>,
    private geolocationService: GeolocationService,
  ) {}

  /**
   * Track a visitor page view
   */
  async trackVisit(ip: string, userAgent: string, page: string): Promise<void> {
    try {
      // Get geolocation data
      const location = await this.geolocationService.getLocationFromIP(ip);

      // Save visitor data
      const visitor = this.visitorRepository.create({
        ip,
        country: location.country,
        city: location.city,
        userAgent,
        page,
      });

      await this.visitorRepository.save(visitor);
      this.logger.log(`Tracked visit from ${location.country} to ${page}`);
    } catch (error) {
      this.logger.error(`Failed to track visit: ${error.message}`, error.stack);
    }
  }

  /**
   * Get visitor statistics
   */
  async getVisitorStats(): Promise<VisitorStats> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total, todayCount, weekCount, monthCount] = await Promise.all([
      this.visitorRepository.count(),
      this.visitorRepository.count({
        where: { visitedAt: Between(today, new Date()) },
      }),
      this.visitorRepository.count({
        where: { visitedAt: Between(weekAgo, new Date()) },
      }),
      this.visitorRepository.count({
        where: { visitedAt: Between(monthAgo, new Date()) },
      }),
    ]);

    return {
      total,
      today: todayCount,
      thisWeek: weekCount,
      thisMonth: monthCount,
    };
  }

  /**
   * Get visitor distribution by country
   */
  async getCountryStats(limit = 10): Promise<CountryStats[]> {
    const results = await this.visitorRepository
      .createQueryBuilder('visitor')
      .select('visitor.country', 'country')
      .addSelect('COUNT(*)', 'count')
      .where('visitor.country IS NOT NULL')
      .andWhere("visitor.country != 'Unknown'")
      .groupBy('visitor.country')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map((r) => ({
      country: r.country,
      count: parseInt(r.count),
    }));
  }

  /**
   * Get daily visitor counts for the last 30 days
   */
  async getDailyVisitors(days = 30): Promise<DailyVisitor[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const results = await this.visitorRepository
      .createQueryBuilder('visitor')
      .select("DATE(visitor.visitedAt)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('visitor.visitedAt >= :startDate', { startDate })
      .groupBy('DATE(visitor.visitedAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return results.map((r) => ({
      date: r.date,
      count: parseInt(r.count),
    }));
  }

  /**
   * Get top visited pages
   */
  async getTopPages(limit = 10): Promise<PageView[]> {
    const results = await this.visitorRepository
      .createQueryBuilder('visitor')
      .select('visitor.page', 'page')
      .addSelect('COUNT(*)', 'count')
      .where('visitor.page IS NOT NULL')
      .groupBy('visitor.page')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map((r) => ({
      page: r.page,
      count: parseInt(r.count),
    }));
  }

  /**
   * Get all analytics data
   */
  async getAnalytics() {
    const [visitorStats, countryStats, dailyVisitors, topPages] = await Promise.all([
      this.getVisitorStats(),
      this.getCountryStats(),
      this.getDailyVisitors(),
      this.getTopPages(),
    ]);

    return {
      visitorStats,
      countryStats,
      dailyVisitors,
      topPages,
    };
  }

  /**
   * Health check endpoint
   */
  async getHealthCheck(): Promise<HealthCheck> {
    let dbStatus: 'connected' | 'disconnected' = 'disconnected';

    try {
      // Test database connection
      await this.visitorRepository.query('SELECT 1');
      dbStatus = 'connected';
    } catch (error) {
      this.logger.error('Database health check failed', error.stack);
    }

    // Get memory usage
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    // Get CPU usage (simple approximation)
    const cpus = os.cpus();
    const cpuUsage =
      cpus.reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
        const idle = cpu.times.idle;
        return acc + ((total - idle) / total) * 100;
      }, 0) / cpus.length;

    return {
      status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
      database: dbStatus,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      memory: {
        used: usedMemory,
        total: totalMemory,
        percentage: (usedMemory / totalMemory) * 100,
      },
      cpu: {
        usage: cpuUsage,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
