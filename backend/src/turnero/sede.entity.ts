import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Sedes')
export class Sede {
  @PrimaryGeneratedColumn({ name: 'idSede' })
  idSede: number;

  @Column({ name: 'nombreSede', nullable: true })
  nombreSede: string;

  @Column({ nullable: true })
  direccion: string;
}
