import { Entity, PrimaryColumn } from 'typeorm';

@Entity('Turnero-Profesor')
export class TurneroProfesor {
  @PrimaryColumn({ name: 'DNIProfe', type: 'numeric' })
  dniProfe: string;

  @PrimaryColumn({ type: 'date' })
  dia: string;

  @PrimaryColumn({ type: 'time' })
  horario: string;

  @PrimaryColumn({ name: 'idSede', type: 'int' })
  idSede: number;
}
