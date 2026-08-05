import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  fecha: string;
}
