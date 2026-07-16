import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('Deuda Socios')
export class DeudaSocio {
  @PrimaryColumn({ name: 'DNI', type: 'numeric' })
  dni: string;

  @Column({ name: 'Deuda', type: 'numeric', nullable: true })
  deuda: string;
}
