import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('Turnero')
export class Turnero {
  @PrimaryColumn({ type: 'date' })
  dia: string;

  @PrimaryColumn({ name: 'idSede', type: 'int' })
  idSede: number;

  @PrimaryColumn({ type: 'time' })
  horario: string;

  @Column({ name: 'horaFin', type: 'time', nullable: true })
  horaFin: string;

  @Column({ type: 'boolean', nullable: true })
  estado: boolean;

  @Column({ name: 'cantReservas', type: 'numeric', nullable: true })
  cantReservas: string;

  @Column({ name: 'idActividad', type: 'int', nullable: true })
  idActividad: number;
}
