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
}
