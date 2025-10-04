import { IsString, IsIn } from 'class-validator';

export class UpdateContactStatusDto {
  @IsString()
  @IsIn(['nouveau', 'en cours', 'traité'])
  status: string;
}
