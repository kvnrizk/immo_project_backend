import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('unavailable_dates')
export class UnavailableDate {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  userId: string;

  @ApiProperty()
  @Column({ type: 'date' })
  date: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  reason?: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
