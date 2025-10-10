import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  Min,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CoordinatesDto {
  @ApiProperty({ example: 48.8566 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: 2.3522 })
  @IsNumber()
  lng: number;
}

export class CreatePropertyDto {
  @ApiProperty({ example: 'Appartement moderne centre-ville' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Lyon 6ème' })
  @IsString()
  location: string;

  @ApiProperty({ example: 'vente', enum: ['vente', 'location', 'saisonnier'] })
  @IsEnum(['vente', 'location', 'saisonnier'])
  type: string;

  @ApiPropertyOptional({ example: 3 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  bedrooms?: number;

  @ApiPropertyOptional({ example: 85 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  area?: number;

  @ApiProperty({ example: '285 000 €' })
  @IsString()
  price: string;

  @ApiProperty({ example: 'Magnifique appartement entièrement rénové' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: ['Wi-Fi', 'Cuisine équipée', 'Balcon'] })
  @IsArray()
  @IsOptional()
  features?: string[];

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({ example: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'] })
  @IsArray()
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ example: { lat: 48.8566, lng: 2.3522 } })
  @IsObject()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  @IsOptional()
  coordinates?: CoordinatesDto;
}
