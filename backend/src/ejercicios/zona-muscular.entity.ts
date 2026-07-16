import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ZonasMusculares')
export class ZonaMuscular {
  @PrimaryGeneratedColumn({ name: 'idZona' })
  idZona: number;

  @Column({ nullable: true })
  nombre: string;
}
