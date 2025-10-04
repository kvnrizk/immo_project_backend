import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactStatusDto } from './dto/update-contact-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('contacts')
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new contact submission' })
  @ApiResponse({ status: 201, description: 'Contact created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() createContactDto: CreateContactDto) {
    return this.contactsService.create(createContactDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all contacts' })
  @ApiResponse({ status: 200, description: 'Returns all contacts' })
  findAll() {
    return this.contactsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a contact by ID' })
  @ApiResponse({ status: 200, description: 'Returns the contact' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  findOne(@Param('id') id: string) {
    return this.contactsService.findOne(+id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update contact status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateContactStatusDto,
  ) {
    return this.contactsService.updateStatus(+id, updateStatusDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a contact' })
  @ApiResponse({ status: 200, description: 'Contact deleted successfully' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  remove(@Param('id') id: string) {
    return this.contactsService.remove(+id);
  }
}
