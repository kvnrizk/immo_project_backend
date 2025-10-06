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
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { FilterReservationDto } from './dto/filter-reservation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Reservation } from './entities/reservation.entity';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  // Public endpoints (no auth required)
  @Post('public')
  @ApiOperation({ summary: 'Create a new reservation from public website (no auth)' })
  @ApiResponse({
    status: 201,
    description: 'Reservation created successfully',
    type: Reservation,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data or past meeting date' })
  createPublic(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationsService.createPublic(createReservationDto);
  }

  @Get('public/available-slots/:propertyId/:date')
  @ApiOperation({ summary: 'Get available time slots (public, no auth)' })
  @ApiResponse({
    status: 200,
    description: 'List of available time slots',
    type: [String],
  })
  getAvailableSlotsPublic(
    @Param('propertyId') propertyId: string,
    @Param('date') date: string,
  ) {
    return this.reservationsService.getAvailableTimeSlots(+propertyId, date);
  }

  // Admin endpoints (auth required)
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new reservation for property visit' })
  @ApiResponse({
    status: 201,
    description: 'Reservation created successfully',
    type: Reservation,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data or past meeting date' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createReservationDto: CreateReservationDto, @Request() req) {
    return this.reservationsService.create(createReservationDto, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all reservations with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'List of reservations',
    type: [Reservation],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query() filterDto: FilterReservationDto, @Request() req) {
    return this.reservationsService.findAll(filterDto, req.user.id);
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get reservation statistics' })
  @ApiResponse({
    status: 200,
    description: 'Reservation statistics',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getStatistics(@Request() req) {
    return this.reservationsService.getStatistics(req.user.id);
  }

  @Get('available-slots/:propertyId/:date')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get available time slots for a property on a specific date' })
  @ApiResponse({
    status: 200,
    description: 'List of available time slots',
    type: [String],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getAvailableSlots(
    @Param('propertyId') propertyId: string,
    @Param('date') date: string,
  ) {
    return this.reservationsService.getAvailableTimeSlots(+propertyId, date);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single reservation by ID' })
  @ApiResponse({
    status: 200,
    description: 'Reservation details',
    type: Reservation,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.reservationsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a reservation' })
  @ApiResponse({
    status: 200,
    description: 'Reservation updated successfully',
    type: Reservation,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  update(
    @Param('id') id: string,
    @Body() updateReservationDto: UpdateReservationDto,
    @Request() req,
  ) {
    return this.reservationsService.update(id, updateReservationDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a reservation' })
  @ApiResponse({ status: 204, description: 'Reservation deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  remove(@Param('id') id: string, @Request() req) {
    return this.reservationsService.remove(id, req.user.id);
  }
}
