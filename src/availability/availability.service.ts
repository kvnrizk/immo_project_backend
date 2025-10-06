import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability, DayOfWeek } from './entities/availability.entity';
import { UnavailableDate } from './entities/unavailable-date.entity';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { CreateUnavailableDateDto } from './dto/create-unavailable-date.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private availabilityRepository: Repository<Availability>,
    @InjectRepository(UnavailableDate)
    private unavailableDateRepository: Repository<UnavailableDate>,
  ) {}

  // Availability management
  async createAvailability(
    createAvailabilityDto: CreateAvailabilityDto,
    userId: string,
  ): Promise<Availability> {
    const availability = this.availabilityRepository.create({
      ...createAvailabilityDto,
      userId,
    });
    return await this.availabilityRepository.save(availability);
  }

  async findAllAvailability(userId: string): Promise<Availability[]> {
    return await this.availabilityRepository.find({
      where: { userId },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async findOneAvailability(id: string, userId: string): Promise<Availability> {
    const availability = await this.availabilityRepository.findOne({
      where: { id, userId },
    });
    if (!availability) {
      throw new NotFoundException(`Availability with ID ${id} not found`);
    }
    return availability;
  }

  async updateAvailability(
    id: string,
    updateAvailabilityDto: UpdateAvailabilityDto,
    userId: string,
  ): Promise<Availability> {
    const availability = await this.findOneAvailability(id, userId);
    Object.assign(availability, updateAvailabilityDto);
    return await this.availabilityRepository.save(availability);
  }

  async removeAvailability(id: string, userId: string): Promise<void> {
    const availability = await this.findOneAvailability(id, userId);
    await this.availabilityRepository.remove(availability);
  }

  // Unavailable dates management
  async createUnavailableDate(
    createUnavailableDateDto: CreateUnavailableDateDto,
    userId: string,
  ): Promise<UnavailableDate> {
    const unavailableDate = this.unavailableDateRepository.create({
      ...createUnavailableDateDto,
      date: new Date(createUnavailableDateDto.date),
      userId,
    });
    return await this.unavailableDateRepository.save(unavailableDate);
  }

  async findAllUnavailableDates(userId: string): Promise<UnavailableDate[]> {
    return await this.unavailableDateRepository.find({
      where: { userId },
      order: { date: 'ASC' },
    });
  }

  async removeUnavailableDate(id: string, userId: string): Promise<void> {
    const unavailableDate = await this.unavailableDateRepository.findOne({
      where: { id, userId },
    });
    if (!unavailableDate) {
      throw new NotFoundException(`Unavailable date with ID ${id} not found`);
    }
    await this.unavailableDateRepository.remove(unavailableDate);
  }

  // Check if a specific date and time is available
  async isAvailable(userId: string, date: Date): Promise<boolean> {
    const dayOfWeek = this.getDayOfWeekFromDate(date);
    const timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

    // Check if date is marked as unavailable
    const unavailableDate = await this.unavailableDateRepository.findOne({
      where: {
        userId,
        date: new Date(date.toISOString().split('T')[0]),
      },
    });

    if (unavailableDate) {
      return false;
    }

    // Check if time falls within available hours for that day
    const availabilities = await this.availabilityRepository.find({
      where: {
        userId,
        dayOfWeek,
        isActive: true,
      },
    });

    if (availabilities.length === 0) {
      return false; // No availability set for this day
    }

    // Check if time falls within any available time slot
    return availabilities.some(
      (avail) => timeString >= avail.startTime && timeString <= avail.endTime,
    );
  }

  private getDayOfWeekFromDate(date: Date): DayOfWeek {
    const days = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    return days[date.getDay()];
  }
}
