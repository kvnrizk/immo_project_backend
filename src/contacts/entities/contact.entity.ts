import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Expose } from 'class-transformer';

@Entity('contacts')
export class Contact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nom: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  telephone: string;

  @Column({ name: 'type_projet' })
  @Expose({ name: 'type_projet' })
  type_projet: string;

  @Column({ name: 'type_bien', nullable: true })
  @Expose({ name: 'type_bien' })
  type_bien: string;

  @Column({ name: 'nombre_pieces', nullable: true })
  @Expose({ name: 'nombre_pieces' })
  nombre_pieces: string;

  @Column({ name: 'surface_min', type: 'int', nullable: true })
  @Expose({ name: 'surface_min' })
  surface_min: number;

  @Column({ name: 'surface_max', type: 'int', nullable: true })
  @Expose({ name: 'surface_max' })
  surface_max: number;

  @Column({ name: 'budget_min', type: 'int', nullable: true })
  @Expose({ name: 'budget_min' })
  budget_min: number;

  @Column({ name: 'budget_max', type: 'int', nullable: true })
  @Expose({ name: 'budget_max' })
  budget_max: number;

  @Column({ nullable: true })
  localisation: string;

  @Column({ nullable: true })
  delai: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ default: 'nouveau' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  @Expose({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @Expose({ name: 'updated_at' })
  updated_at: Date;
}
