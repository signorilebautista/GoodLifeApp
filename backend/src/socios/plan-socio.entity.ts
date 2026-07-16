import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('PlanSocio')
export class PlanSocio {
  @PrimaryColumn({ name: 'dniSocio' })
  dniSocio: string;

  @Column({ type: 'jsonb' })
  plan: object;

  @UpdateDateColumn()
  updatedAt: Date;
}
