import { IsEnum, IsNotEmpty, IsString, IsInt, IsDateString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReservationType, ReservationStatus } from '../entities/reservation.entity';

export class CreateReservationDto {
  @ApiProperty({ description: 'Property ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  propertyId: number;

  @ApiProperty({ description: 'Client full name', example: 'Jean Dupont' })
  @IsString()
  @IsNotEmpty()
  clientName: string;

  @ApiProperty({ description: 'Client email', example: 'jean.dupont@example.com' })
  @IsEmail()
  @IsNotEmpty()
  clientEmail: string;

  @ApiProperty({ description: 'Client phone number', example: '+33 6 12 34 56 78' })
  @IsString()
  @IsNotEmpty()
  clientPhone: string;

  @ApiProperty({
    description: 'Reservation type (vente or location only)',
    enum: ReservationType,
    example: ReservationType.VENTE,
  })
  @IsEnum(ReservationType)
  @IsNotEmpty()
  type: ReservationType;

  @ApiProperty({
    description: 'Meeting date and time',
    example: '2025-10-15T14:30:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  meetingDate: string;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Client prefers morning visits',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Reservation status',
    enum: ReservationStatus,
    example: ReservationStatus.EN_ATTENTE,
    required: false,
  })
  @IsEnum(ReservationStatus)
  @IsOptional()
  status?: ReservationStatus;
}
