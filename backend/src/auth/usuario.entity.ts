import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  mail: string;

  @Column()
  passwordHash: string;

  @Column()
  salt: string;

  @Column({ default: 'profesor' })
  role: string;

  @Column({ nullable: true })
  nombre: string;

  @Column({ nullable: true, name: 'profesorDni' })
  profesorDni: string;

  @Column({ default: true })
  mustChangePassword: boolean;
}
