import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { GeocodingService } from './geocoding.service';
import { Property } from './entities/property.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Property]),
    CloudinaryModule,
  ],
  controllers: [PropertiesController],
  providers: [PropertiesService, GeocodingService],
  exports: [PropertiesService],
})
export class PropertiesModule {}