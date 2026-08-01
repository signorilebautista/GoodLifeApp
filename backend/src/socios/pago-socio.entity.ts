import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Pagos Socios')
export class PagoSocio {
  @PrimaryGeneratedColumn({ name: 'idPago' })
  idPago: number;

  @Column({ name: 'DNISocio', type: 'numeric' })
  dniSocio: string;

  @CreateDateColumn({ name: 'fechaPago' })
  fechaPago: Date;

  @Column({ name: 'monto', type: 'numeric' })
  monto: number;

  @Column({ name: 'diasVigencia', type: 'int', default: 30 })
  diasVigencia: number;
}
