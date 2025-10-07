import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Property } from '../../properties/entities/property.entity';
import { User } from '../../users/entities/user.entity';

export enum ReservationType {
  VENTE = 'vente',
  LOCATION = 'location',
}

export enum ReservationStatus {
  EN_ATTENTE = 'en_attente',
  CONFIRMEE = 'confirmée',
  ANNULEE = 'annulée',
  EXPIREE = 'expirée',
  TERMINEE = 'terminée',
}

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  propertyId: number;

  @ManyToOne(() => Property, { eager: true })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column()
  clientName: string;

  @Column()
  clientEmail: string;

  @Column()
  clientPhone: string;

  @Column({
    type: 'enum',
    enum: ReservationType,
  })
  type: ReservationType;

  @Column({ type: 'timestamp' })
  meetingDate: Date;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.EN_ATTENTE,
  })
  status: ReservationStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  userId?: string;

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
