import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Membresia')
export class Membresia {
  @PrimaryGeneratedColumn({ name: 'idMembresia' })
  idMembresia: number;

  @Column({ name: 'nombreMembresia', nullable: true })
  nombreMembresia: string;
}
