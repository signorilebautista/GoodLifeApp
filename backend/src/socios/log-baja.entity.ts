import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('LogBajas')
export class LogBaja {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'dniSocio' })
  dniSocio: string;

  @CreateDateColumn({ name: 'fecha' })
  fecha: Date;
}
