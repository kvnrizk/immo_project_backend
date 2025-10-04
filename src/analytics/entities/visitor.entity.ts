import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('visitors')
@Index(['visitedAt'])
@Index(['country'])
@Index(['page'])
export class Visitor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, length: 45 })
  ip: string;

  @Column({ nullable: true, length: 100 })
  country: string;

  @Column({ nullable: true, length: 100 })
  city: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ nullable: true, length: 500 })
  page: string;

  @CreateDateColumn()
  visitedAt: Date;
}
