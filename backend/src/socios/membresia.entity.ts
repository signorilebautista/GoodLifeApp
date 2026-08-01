import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Membresia')
export class Membresia {
  @PrimaryGeneratedColumn({ name: 'idMembresia' })
  idMembresia: number;

  @Column({ name: 'nombreMembresia', nullable: true })
  nombreMembresia: string;

  @Column({ name: 'cantidadClases', nullable: true, type: 'int' })
  cantidadClases: number | null;

  @Column({ name: 'precio', type: 'numeric', nullable: true })
  precio: number | null;
}
