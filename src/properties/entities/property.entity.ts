import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column()
  price: string;

  @Column()
  location: string;

  @Column({
    type: 'enum',
    enum: ['vente', 'location', 'saisonnier'],
    default: 'vente',
  })
  type: string;

  @Column({ nullable: true })
  bedrooms: number;

  @Column({ nullable: true })
  area: number;

  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @Column({ nullable: true })
  image: string;

  @Column({ type: 'simple-array', nullable: true })
  features: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'simple-json', nullable: true })
  unavailableDates: Array<{ date: string; reason?: string }>;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
