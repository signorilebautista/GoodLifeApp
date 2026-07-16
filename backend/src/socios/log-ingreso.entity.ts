import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('LogIngresos')
export class LogIngreso {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'dniSocio' })
  dniSocio: string;

  @CreateDateColumn({ name: 'fecha' })
  fecha: Date;
}
