import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('LogIngresos')
export class LogIngreso {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'dniSocio' })
  dniSocio: string;

  @Column({ name: 'idSede', type: 'int', nullable: true })
  idSede: number | null;

  @CreateDateColumn({ name: 'fecha' })
  fecha: Date;
}
