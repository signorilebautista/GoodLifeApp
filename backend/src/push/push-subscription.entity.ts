import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('PushSubscriptions')
export class PushSubscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'dniSocio' })
  dniSocio: string;

  @Column({ unique: true })
  endpoint: string;

  @Column()
  p256dh: string;

  @Column()
  auth: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;
}
