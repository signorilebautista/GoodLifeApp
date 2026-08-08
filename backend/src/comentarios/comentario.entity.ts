import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Comentarios')
export class Comentario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'dniSocio' })
  dniSocio: string;

  @Column({ type: 'text' })
  texto: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @Column({ default: false })
  leido: boolean;

  @Column({ name: 'leidoEn', type: 'timestamp', nullable: true })
  leidoEn: Date | null;
}
