import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('ExamenSocio')
export class ExamenSocio {
  @PrimaryColumn({ name: 'dniSocio' })
  dniSocio: string;

  @Column({ type: 'jsonb' })
  examen: object;

  @UpdateDateColumn()
  updatedAt: Date;
}
