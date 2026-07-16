import { Entity, PrimaryColumn } from 'typeorm';

@Entity('Turno-Socio')
export class TurnoSocio {
  @PrimaryColumn({ name: 'DNISocio', type: 'numeric' })
  dniSocio: string;

  @PrimaryColumn({ type: 'date' })
  dia: string;

  @PrimaryColumn({ name: 'idSede', type: 'int' })
  idSede: number;

  @PrimaryColumn({ type: 'time' })
  horario: string;
}
