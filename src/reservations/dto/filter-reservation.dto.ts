import { IsOptional, IsEnum, IsDateString, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReservationType, ReservationStatus } from '../entities/reservation.entity';
import { Type } from 'class-transformer';

export class FilterReservationDto {
  @ApiPropertyOptional({
    description: 'Filter by reservation status',
    enum: ReservationStatus,
  })
  @IsEnum(ReservationStatus)
  @IsOptional()
  status?: ReservationStatus;

  @ApiPropertyOptional({
    description: 'Filter by reservation type (vente or location)',
    enum: ReservationType,
  })
  @IsEnum(ReservationType)
  @IsOptional()
  type?: ReservationType;

  @ApiPropertyOptional({
    description: 'Filter by property ID',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  propertyId?: number;

  @ApiPropertyOptional({
    description: 'Filter meetings from this date',
    example: '2025-10-01T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter meetings until this date',
    example: '2025-10-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  dateTo?: string;
}
