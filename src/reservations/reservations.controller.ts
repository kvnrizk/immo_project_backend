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
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
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
  @ApiOperation({ summary: 'Get reservation statistics' })
  @ApiResponse({
    status: 200,
    description: 'Reservation statistics',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getStatistics(@Request() req) {
    return this.reservationsService.getStatistics(req.user.id);
  }

  @Get(':id')
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
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a reservation' })
  @ApiResponse({ status: 204, description: 'Reservation deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  remove(@Param('id') id: string, @Request() req) {
    return this.reservationsService.remove(id, req.user.id);
  }
}
