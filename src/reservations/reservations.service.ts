import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, In } from 'typeorm';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { FilterReservationDto } from './dto/filter-reservation.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AvailabilityService } from '../availability/availability.service';

@Injectable()
export class ReservationsService {
  private readonly TIME_SLOTS = [
    '09:00', '10:00', '11:00', '12:00',
    '14:00', '15:00', '16:00', '17:00',
  ];

  constructor(
    @InjectRepository(Reservation)
    private reservationsRepository: Repository<Reservation>,
    private availabilityService: AvailabilityService,
  ) {}

  async create(
    createReservationDto: CreateReservationDto,
    userId: string,
  ): Promise<Reservation> {
    const meetingDate = new Date(createReservationDto.meetingDate);
    const now = new Date();

    if (meetingDate <= now) {
      throw new BadRequestException('Meeting date must be in the future');
    }

    // Check time slot availability
    await this.checkTimeSlotAvailability(
      createReservationDto.propertyId,
      meetingDate,
    );

    const reservation = this.reservationsRepository.create({
      ...createReservationDto,
      meetingDate,
      userId,
      status: createReservationDto.status || ReservationStatus.EN_ATTENTE,
    });

    return await this.reservationsRepository.save(reservation);
  }

  // Public endpoint for creating reservations without authentication
  async createPublic(
    createReservationDto: CreateReservationDto,
  ): Promise<Reservation> {
    const meetingDate = new Date(createReservationDto.meetingDate);
    const now = new Date();

    if (meetingDate <= now) {
      throw new BadRequestException('Meeting date must be in the future');
    }

    // Check time slot availability
    await this.checkTimeSlotAvailability(
      createReservationDto.propertyId,
      meetingDate,
    );

    // For public reservations, use a default system user ID or leave userId empty
    const reservation = this.reservationsRepository.create({
      ...createReservationDto,
      meetingDate,
      userId: 'public', // Mark as public reservation
      status: ReservationStatus.EN_ATTENTE,
    });

    return await this.reservationsRepository.save(reservation);
  }

  async findAll(filterDto: FilterReservationDto, userId?: string): Promise<Reservation[]> {
    const query = this.reservationsRepository.createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.property', 'property')
      .orderBy('reservation.meetingDate', 'ASC');

    if (userId) {
      query.where('reservation.userId = :userId', { userId });
    }

    if (filterDto.status) {
      query.andWhere('reservation.status = :status', { status: filterDto.status });
    }

    if (filterDto.type) {
      query.andWhere('reservation.type = :type', { type: filterDto.type });
    }

    if (filterDto.propertyId) {
      query.andWhere('reservation.propertyId = :propertyId', { propertyId: filterDto.propertyId });
    }

    if (filterDto.dateFrom && filterDto.dateTo) {
      query.andWhere('reservation.meetingDate BETWEEN :dateFrom AND :dateTo', {
        dateFrom: new Date(filterDto.dateFrom),
        dateTo: new Date(filterDto.dateTo),
      });
    } else if (filterDto.dateFrom) {
      query.andWhere('reservation.meetingDate >= :dateFrom', {
        dateFrom: new Date(filterDto.dateFrom),
      });
    } else if (filterDto.dateTo) {
      query.andWhere('reservation.meetingDate <= :dateTo', {
        dateTo: new Date(filterDto.dateTo),
      });
    }

    return await query.getMany();
  }

  async findOne(id: string, userId?: string): Promise<Reservation> {
    const query = this.reservationsRepository.createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.property', 'property')
      .where('reservation.id = :id', { id });

    if (userId) {
      query.andWhere('reservation.userId = :userId', { userId });
    }

    const reservation = await query.getOne();

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    return reservation;
  }

  async update(
    id: string,
    updateReservationDto: UpdateReservationDto,
    userId?: string,
  ): Promise<Reservation> {
    const reservation = await this.findOne(id, userId);

    if (updateReservationDto.meetingDate) {
      const meetingDate = new Date(updateReservationDto.meetingDate);

      // Check time slot availability when changing meeting date
      await this.checkTimeSlotAvailability(
        updateReservationDto.propertyId || reservation.propertyId,
        meetingDate,
        id,
      );

      updateReservationDto.meetingDate = meetingDate.toISOString();
    }

    Object.assign(reservation, updateReservationDto);

    return await this.reservationsRepository.save(reservation);
  }

  async remove(id: string, userId?: string): Promise<void> {
    const reservation = await this.findOne(id, userId);
    await this.reservationsRepository.remove(reservation);
  }

  // Check if a time slot is available
  private async checkTimeSlotAvailability(
    propertyId: number,
    meetingDate: Date,
    excludeReservationId?: string,
  ): Promise<void> {
    const dayOfWeek = meetingDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      throw new BadRequestException('Reservations are not available on weekends');
    }

    const hour = meetingDate.getHours();
    const minute = meetingDate.getMinutes();
    const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

    if (!this.TIME_SLOTS.includes(timeString)) {
      throw new BadRequestException(`Invalid time slot. Available slots: ${this.TIME_SLOTS.join(", ")}`);
    }

    // Check for existing reservations at the same time
    const existingQuery = this.reservationsRepository.createQueryBuilder('reservation')
      .where('reservation.propertyId = :propertyId', { propertyId })
      .andWhere('reservation.meetingDate = :meetingDate', { meetingDate })
      .andWhere('reservation.status IN (:...statuses)', {
        statuses: [ReservationStatus.EN_ATTENTE, ReservationStatus.CONFIRMEE],
      });

    if (excludeReservationId) {
      existingQuery.andWhere('reservation.id != :id', { id: excludeReservationId });
    }

    const existingReservation = await existingQuery.getOne();

    if (existingReservation) {
      throw new BadRequestException('This time slot is already booked for this property');
    }
  }

  // Get available time slots for a property on a specific date
  async getAvailableTimeSlots(propertyId: number, date: string, userId?: string): Promise<string[]> {
    const targetDate = new Date(date);

    // Get all unavailable dates (for public API, fetch all; for admin, fetch by userId)
    const unavailableDates = userId === 'public'
      ? await this.availabilityService.findAllUnavailableDates() // Fetch ALL unavailable dates for public
      : await this.availabilityService.findAllUnavailableDates(userId); // Fetch user-specific for admin

    // Check if this specific date is blocked
    const dateStr = targetDate.toISOString().split('T')[0];
    const blockedSlots = unavailableDates
      .filter(blocked => {
        const blockedDateStr = new Date(blocked.date).toISOString().split('T')[0];
        return blockedDateStr === dateStr;
      })
      .map(blocked => {
        // Extract time from reason if it's a specific time block
        const match = blocked.reason?.match(/Bloqué:\s*(\d{2}:\d{2})/);
        return match ? match[1] : null;
      })
      .filter(time => time !== null);

    // Check if entire day is blocked (reason doesn't contain "Bloqué:")
    const isDayBlocked = unavailableDates.some(blocked => {
      const blockedDateStr = new Date(blocked.date).toISOString().split('T')[0];
      return blockedDateStr === dateStr && !blocked.reason?.includes('Bloqué:');
    });

    if (isDayBlocked) {
      return []; // Entire day is blocked
    }

    // Generate default time slots (9:00 to 16:00)
    const defaultSlots = this.TIME_SLOTS;

    // Get all reservations for this property on this date
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const reservations = await this.reservationsRepository.find({
      where: {
        propertyId,
        meetingDate: Between(startOfDay, endOfDay),
        status: In([ReservationStatus.EN_ATTENTE, ReservationStatus.CONFIRMEE]),
      },
    });

    // Get booked time slots from reservations
    const bookedSlots = reservations.map(reservation => {
      const hour = reservation.meetingDate.getHours();
      const minute = reservation.meetingDate.getMinutes();
      return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    });

    // Return only slots that are:
    // 1. Not blocked by admin
    // 2. Not already booked
    return defaultSlots.filter(slot =>
      !blockedSlots.includes(slot) && !bookedSlots.includes(slot)
    );
  }

  // Cron job runs every hour to check for expired reservations
  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredReservations() {
    const now = new Date();

    // Find reservations that are in 'en_attente' status and meeting date has passed
    const expiredReservations = await this.reservationsRepository.find({
      where: {
        status: ReservationStatus.EN_ATTENTE,
        meetingDate: LessThan(now),
      },
    });

    if (expiredReservations.length > 0) {
      for (const reservation of expiredReservations) {
        reservation.status = ReservationStatus.EXPIREE;
      }

      await this.reservationsRepository.save(expiredReservations);

      console.log(`Updated ${expiredReservations.length} reservations to expired status`);
    }
  }

  // Get upcoming reservations for calendar view
  async getUpcomingReservations(userId?: string, days: number = 30): Promise<Reservation[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const query = this.reservationsRepository.createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.property', 'property')
      .where('reservation.meetingDate BETWEEN :now AND :futureDate', { now, futureDate })
      .andWhere('reservation.status IN (:...statuses)', {
        statuses: [ReservationStatus.EN_ATTENTE, ReservationStatus.CONFIRMEE],
      })
      .orderBy('reservation.meetingDate', 'ASC');

    if (userId) {
      query.andWhere('reservation.userId = :userId', { userId });
    }

    return await query.getMany();
  }

  // Get statistics
  async getStatistics(userId?: string) {
    const query = this.reservationsRepository.createQueryBuilder('reservation');

    if (userId) {
      query.where('reservation.userId = :userId', { userId });
    }

    const total = await query.getCount();

    const byStatus = await query
      .select('reservation.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('reservation.status')
      .getRawMany();

    const byType = await query
      .select('reservation.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('reservation.type')
      .getRawMany();

    return {
      total,
      byStatus: byStatus.reduce((acc, curr) => {
        acc[curr.status] = parseInt(curr.count);
        return acc;
      }, {}),
      byType: byType.reduce((acc, curr) => {
        acc[curr.type] = parseInt(curr.count);
        return acc;
      }, {}),
    };
  }
}
