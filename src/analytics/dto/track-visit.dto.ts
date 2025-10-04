import { IsString, IsNotEmpty } from 'class-validator';

export class TrackVisitDto {
  @IsString()
  @IsNotEmpty()
  page: string;
}
