import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { FilterReservationDto } from './dto/filter-reservation.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private reservationsRepository: Repository<Reservation>,
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

    const reservation = this.reservationsRepository.create({
      ...createReservationDto,
      meetingDate,
      userId,
      status: createReservationDto.status || ReservationStatus.EN_ATTENTE,
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
      updateReservationDto.meetingDate = meetingDate.toISOString();
    }

    Object.assign(reservation, updateReservationDto);

    return await this.reservationsRepository.save(reservation);
  }

  async remove(id: string, userId?: string): Promise<void> {
    const reservation = await this.findOne(id, userId);
    await this.reservationsRepository.remove(reservation);
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
