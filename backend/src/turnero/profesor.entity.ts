import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('Profesores')
export class Profesor {
  @PrimaryColumn({ name: 'DNI', type: 'numeric' })
  dni: string;

  @Column({ nullable: true })
  nombre: string;

  @Column({ nullable: true })
  apellido: string;

  @Column({ type: 'numeric', nullable: true })
  telefono: string;

  @Column({ name: 'idSede', type: 'numeric', nullable: true })
  idSede: string;

  @Column({ nullable: true })
  mail: string;
}
