import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('RegistrosPeso')
export class RegistroPeso {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuarioId', type: 'varchar' })
  usuarioId: string;

  @Column({ name: 'ejercicioId', type: 'int' })
  ejercicioId: number;

  @Column({ type: 'numeric', precision: 6, scale: 2 })
  peso: number;

  @CreateDateColumn({ name: 'fecha', type: 'date' })
  fecha: string;
}
