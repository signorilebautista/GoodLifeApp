import { IsBoolean, IsInt, IsNumberString, IsOptional, IsString } from 'class-validator';

export class CreateSedeDto {
  @IsString() nombre: string;
  @IsOptional() @IsString() direccion?: string;
}

export class CreateProfesorDto {
  @IsNumberString() dni: string;
  @IsString() nombre: string;
  @IsString() apellido: string;
  @IsOptional() @IsString() telefono?: string;
  @IsOptional() @IsString() mail?: string;
  @IsOptional() @IsNumberString() idSede?: string;
}

export class CreateMembresiaDto {
  @IsString() nombreMembresia: string;
}

export class CreateTurnoDto {
  @IsString()
  dia: string;

  @IsString()
  horario: string;

  @IsOptional()
  @IsString()
  horaFin?: string;

  @IsInt()
  idSede: number;

  @IsInt()
  idActividad: number;

  @IsNumberString()
  dniProfesor: string;

  @IsOptional()
  @IsNumberString()
  cantReservas?: string;

  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}

export class UpdateTurnoDto extends CreateTurnoDto {
  @IsString()
  oldDia: string;

  @IsString()
  oldHorario: string;

  @IsInt()
  oldIdSede: number;
}
