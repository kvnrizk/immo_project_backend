import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './services/analytics.service';
import { GeolocationService } from './services/geolocation.service';
import { Visitor } from './entities/visitor.entity';
import { VisitorTrackingMiddleware } from './middleware/visitor-tracking.middleware';

@Module({
  imports: [TypeOrmModule.forFeature([Visitor])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, GeolocationService],
  exports: [AnalyticsService],
})
export class AnalyticsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply visitor tracking middleware to all routes
    consumer.apply(VisitorTrackingMiddleware).forRoutes('*');
  }
}
