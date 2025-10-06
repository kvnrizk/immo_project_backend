import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from './entities/property.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
  ) {}

  async create(
    createPropertyDto: CreatePropertyDto,
    userId: string,
  ): Promise<Property> {
    const property = this.propertyRepository.create({
      ...createPropertyDto,
      userId,
    });
    return await this.propertyRepository.save(property);
  }

  async findAll(type?: string, includeInactive = false): Promise<Property[]> {
    const where: any = {};

    if (type) {
      where.type = type;
    }

    // Only show active properties by default (for public frontend)
    if (!includeInactive) {
      where.isActive = true;
    }

    return await this.propertyRepository.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Property> {
    const property = await this.propertyRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['user'],
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    return property;
  }

  async findByUser(userId: string): Promise<Property[]> {
    return await this.propertyRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    updatePropertyDto: UpdatePropertyDto,
    userId: string,
  ): Promise<Property> {
    const property = await this.findOne(id);

    if (property.userId !== userId) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    Object.assign(property, updatePropertyDto);
    return await this.propertyRepository.save(property);
  }

  async addImages(id: string, images: string[], userId: string): Promise<Property> {
    const property = await this.findOne(id);

    if (property.userId !== userId) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    property.images = property.images
      ? [...property.images, ...images]
      : images;

    if (!property.image && images.length > 0) {
      property.image = images[0];
    }

    return await this.propertyRepository.save(property);
  }

  async setMainImage(id: string, imageUrl: string, userId: string): Promise<Property> {
    const property = await this.findOne(id);

    if (property.userId !== userId) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    property.image = imageUrl;
    return await this.propertyRepository.save(property);
  }

  async deleteImage(id: string, imageUrl: string, userId: string): Promise<Property> {
    const property = await this.findOne(id);

    if (property.userId !== userId) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    if (property.images) {
      property.images = property.images.filter(img => img !== imageUrl);
    }

    // If the deleted image was the main image, set a new main image
    if (property.image === imageUrl) {
      property.image = (property.images && property.images.length > 0 ? property.images[0] : undefined) as string;
    }

    return await this.propertyRepository.save(property);
  }

  async reorderImages(id: string, imageUrls: string[], userId: string): Promise<Property> {
    const property = await this.findOne(id);

    if (property.userId !== userId) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    property.images = imageUrls;
    // Set the first image as the main image
    if (imageUrls.length > 0) {
      property.image = imageUrls[0];
    }

    return await this.propertyRepository.save(property);
  }

  async remove(id: string, userId: string): Promise<void> {
    const property = await this.findOne(id);

    if (property.userId !== userId) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    await this.propertyRepository.remove(property);
  }

  async getUnavailableDates(id: string): Promise<string[]> {
    const property = await this.findOne(id);

    if (!property.unavailableDates) {
      return [];
    }

    return property.unavailableDates.map(item => item.date);
  }

  async addUnavailableDate(id: string, date: string, reason?: string): Promise<Property> {
    const property = await this.findOne(id);

    if (!property.unavailableDates) {
      property.unavailableDates = [];
    }

    // Check if date already exists
    const exists = property.unavailableDates.some(item => item.date === date);
    if (!exists) {
      property.unavailableDates.push({ date, reason });
    }

    return await this.propertyRepository.save(property);
  }

  async removeUnavailableDate(id: string, date: string): Promise<Property> {
    const property = await this.findOne(id);

    if (property.unavailableDates) {
      property.unavailableDates = property.unavailableDates.filter(
        item => item.date !== date
      );
    }

    return await this.propertyRepository.save(property);
  }

  async toggleActive(id: string, userId: string): Promise<Property> {
    const property = await this.findOne(id);

    if (property.userId !== userId) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    property.isActive = !property.isActive;
    return await this.propertyRepository.save(property);
  }
}
