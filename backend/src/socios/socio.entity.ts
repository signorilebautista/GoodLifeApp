import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('Socios')
export class Socio {
  @PrimaryColumn({ name: 'DNI', type: 'numeric' })
  dni: string;

  @Column({ nullable: true })
  nombre: string;

  @Column({ nullable: true })
  apellido: string;

  @Column({ nullable: true })
  direccion: string;

  @Column({ nullable: true })
  mail: string;

  @Column({ type: 'numeric', nullable: true })
  telefono: string;

  @Column({ name: 'idMembresia', type: 'int', nullable: true })
  idMembresia: number;

  @Column({ name: 'clasesRestantes', type: 'numeric', nullable: true })
  clasesRestantes: string;

  @Column({ name: 'idProfesor', type: 'numeric', nullable: true })
  idProfesor: string | null;

  @CreateDateColumn({ name: 'fechaAlta', nullable: true })
  fechaAlta: Date;

  @Column({ name: 'estado', length: 1, default: 'A' })
  estado: string;

  @Column({ name: 'fechaUltimoPago', type: 'date', nullable: true })
  fechaUltimoPago: string | null;

  @Column({ name: 'proximoPago', type: 'date', nullable: true })
  proximoPago: string | null;

  @Column({ name: 'fotoUrl', type: 'text', nullable: true })
  fotoUrl: string | null;
}
