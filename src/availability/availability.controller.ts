import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { CreateUnavailableDateDto } from './dto/create-unavailable-date.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Availability } from './entities/availability.entity';
import { UnavailableDate } from './entities/unavailable-date.entity';

@ApiTags('availability')
@Controller('availability')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  // Weekly availability management
  @Post()
  @ApiOperation({ summary: 'Create a new availability slot' })
  @ApiResponse({
    status: 201,
    description: 'Availability created successfully',
    type: Availability,
  })
  createAvailability(
    @Body() createAvailabilityDto: CreateAvailabilityDto,
    @Request() req,
  ) {
    return this.availabilityService.createAvailability(
      createAvailabilityDto,
      req.user.id,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all availability slots' })
  @ApiResponse({
    status: 200,
    description: 'List of availability slots',
    type: [Availability],
  })
  findAllAvailability(@Request() req) {
    return this.availabilityService.findAllAvailability(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single availability slot by ID' })
  @ApiResponse({
    status: 200,
    description: 'Availability slot details',
    type: Availability,
  })
  findOneAvailability(@Param('id') id: string, @Request() req) {
    return this.availabilityService.findOneAvailability(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an availability slot' })
  @ApiResponse({
    status: 200,
    description: 'Availability updated successfully',
    type: Availability,
  })
  updateAvailability(
    @Param('id') id: string,
    @Body() updateAvailabilityDto: UpdateAvailabilityDto,
    @Request() req,
  ) {
    return this.availabilityService.updateAvailability(
      id,
      updateAvailabilityDto,
      req.user.id,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an availability slot' })
  @ApiResponse({ status: 204, description: 'Availability deleted successfully' })
  removeAvailability(@Param('id') id: string, @Request() req) {
    return this.availabilityService.removeAvailability(id, req.user.id);
  }

  // Unavailable dates management
  @Post('unavailable-dates')
  @ApiOperation({ summary: 'Mark a date as unavailable' })
  @ApiResponse({
    status: 201,
    description: 'Unavailable date created successfully',
    type: UnavailableDate,
  })
  createUnavailableDate(
    @Body() createUnavailableDateDto: CreateUnavailableDateDto,
    @Request() req,
  ) {
    return this.availabilityService.createUnavailableDate(
      createUnavailableDateDto,
      req.user.id,
    );
  }

  @Get('unavailable-dates/list')
  @ApiOperation({ summary: 'Get all unavailable dates' })
  @ApiResponse({
    status: 200,
    description: 'List of unavailable dates',
    type: [UnavailableDate],
  })
  findAllUnavailableDates(@Request() req) {
    return this.availabilityService.findAllUnavailableDates(req.user.id);
  }

  @Delete('unavailable-dates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an unavailable date' })
  @ApiResponse({ status: 204, description: 'Unavailable date removed successfully' })
  removeUnavailableDate(@Param('id') id: string, @Request() req) {
    return this.availabilityService.removeUnavailableDate(id, req.user.id);
  }
}
