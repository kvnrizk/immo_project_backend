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
  UseInterceptors,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@ApiTags('properties')
@Controller('properties')
export class PropertiesController {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new property' })
  @ApiResponse({ status: 201, description: 'Property created successfully' })
  create(@Body() createPropertyDto: CreatePropertyDto, @Request() req) {
    return this.propertiesService.create(createPropertyDto, req.user.id);
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload images for a property' })
  @ApiResponse({ status: 200, description: 'Images uploaded successfully' })
  async uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Request() req,
  ) {
    // Upload all images to Cloudinary
    const uploadPromises = files.map((file) =>
      this.cloudinaryService.uploadImage(file),
    );
    const uploadResults = await Promise.all(uploadPromises);

    // Get the secure URLs from Cloudinary
    const imageUrls = uploadResults.map((result) => result.secure_url);

    return this.propertiesService.addImages(id, imageUrls, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all properties' })
  @ApiResponse({ status: 200, description: 'Return all properties' })
  findAll(@Query('type') type?: string, @Query('includeInactive') includeInactive?: string) {
    // Convert string query param to boolean, default to false
    const showInactive = includeInactive === 'true';
    return this.propertiesService.findAll(type, showInactive);
  }

  @Get('my-properties')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user properties' })
  @ApiResponse({ status: 200, description: 'Return user properties' })
  findMyProperties(@Request() req) {
    return this.propertiesService.findByUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a property by id' })
  @ApiResponse({ status: 200, description: 'Return the property' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a property' })
  @ApiResponse({ status: 200, description: 'Property updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @Request() req,
  ) {
    return this.propertiesService.update(id, updatePropertyDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a property' })
  @ApiResponse({ status: 200, description: 'Property deleted successfully' })
  remove(@Param('id') id: string, @Request() req) {
    return this.propertiesService.remove(id, req.user.id);
  }

  @Get(':id/unavailable-dates')
  @ApiOperation({ summary: 'Get unavailable dates for a property' })
  @ApiResponse({ status: 200, description: 'Return unavailable dates' })
  getUnavailableDates(@Param('id') id: string) {
    return this.propertiesService.getUnavailableDates(id);
  }

  @Post(':id/unavailable-dates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add unavailable date to a property' })
  @ApiResponse({ status: 200, description: 'Unavailable date added successfully' })
  addUnavailableDate(
    @Param('id') id: string,
    @Body() body: { unavailable_date: string; reason?: string },
  ) {
    return this.propertiesService.addUnavailableDate(id, body.unavailable_date, body.reason);
  }

  @Delete(':id/unavailable-dates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove unavailable date from a property' })
  @ApiResponse({ status: 200, description: 'Unavailable date removed successfully' })
  removeUnavailableDate(
    @Param('id') id: string,
    @Body() body: { unavailable_date: string },
  ) {
    return this.propertiesService.removeUnavailableDate(id, body.unavailable_date);
  }

  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle property active status' })
  @ApiResponse({ status: 200, description: 'Property status toggled successfully' })
  toggleActive(@Param('id') id: string, @Request() req) {
    return this.propertiesService.toggleActive(id, req.user.id);
  }

  @Delete(':id/images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an image from a property' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  deleteImage(
    @Param('id') id: string,
    @Body() body: { imageUrl: string },
    @Request() req,
  ) {
    return this.propertiesService.deleteImage(id, body.imageUrl, req.user.id);
  }

  @Patch(':id/reorder-images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder images for a property' })
  @ApiResponse({ status: 200, description: 'Images reordered successfully' })
  reorderImages(
    @Param('id') id: string,
    @Body() body: { imageUrls: string[] },
    @Request() req,
  ) {
    return this.propertiesService.reorderImages(id, body.imageUrls, req.user.id);
  }
}
