import { IsString, IsEmail, IsOptional, IsArray, IsNumber } from 'class-validator';

export class CreateContactDto {
  @IsString()
  nom: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsString()
  typeProjet: string;

  @IsOptional()
  @IsString()
  typeBien?: string;

  @IsOptional()
  @IsString()
  nombrePieces?: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  surfaceRange?: [number, number];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  budgetRange?: [number, number];

  @IsOptional()
  @IsString()
  localisation?: string;

  @IsOptional()
  @IsString()
  delai?: string;

  @IsOptional()
  @IsString()
  message?: string;
}
