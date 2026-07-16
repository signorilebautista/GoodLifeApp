import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('Actividades')
export class Actividad {
  @PrimaryColumn({ name: 'idActividad', type: 'int' })
  idActividad: number;

  @Column({ nullable: true })
  actividad: string;
}
