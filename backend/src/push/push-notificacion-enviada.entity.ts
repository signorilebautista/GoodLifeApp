import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('PushNotificacionesEnviadas')
@Index(['dniSocio', 'tipo', 'fechaEnvio'], { unique: true })
export class PushNotificacionEnviada {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'dniSocio' })
  dniSocio: string;

  @Column({ type: 'varchar' })
  tipo: 'proximo' | 'vencido';

  @Column({ name: 'fechaEnvio', type: 'date' })
  fechaEnvio: string;
}
