import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ZonaMuscular } from './zona-muscular.entity';

@Entity('Ejercicios')
export class Ejercicio {
  @PrimaryGeneratedColumn({ name: 'idEjercicio' })
  idEjercicio: number;

  @Column({ nullable: true })
  nombre: string;

  @Column({ name: 'idZona', type: 'int', nullable: true })
  idZona: number | null;

  @ManyToOne(() => ZonaMuscular, { eager: true, nullable: true })
  @JoinColumn({ name: 'idZona' })
  zona: ZonaMuscular | null;

  @Column({ name: 'videoUrl', type: 'varchar', nullable: true })
  videoUrl: string | null;
}
