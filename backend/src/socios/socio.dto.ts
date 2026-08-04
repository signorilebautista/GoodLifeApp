import { IsDateString, IsInt, IsNumberString, IsOptional, IsString, ValidateIf } from 'class-validator';

export class LoginSocioDto {
  @IsNumberString()
  dni: string;
}

export class CreateMembresiaDto {
  @IsString() nombreMembresia: string;
  @IsOptional() @IsInt() cantidadClases?: number;
  @IsOptional() precio?: number;
}

export class UpdateSocioDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsString() apellido?: string;
  @IsOptional() @IsString() direccion?: string;
  @IsOptional() @IsString() mail?: string;
  @IsOptional() @IsNumberString() telefono?: string;
  @IsOptional() @IsInt() idMembresia?: number;
  @IsOptional() @IsNumberString() clasesRestantes?: string;
  @IsOptional() @IsNumberString({ no_symbols: false }) deuda?: string;
  @IsOptional() @IsString() idProfesor?: string;
  @IsOptional() @IsDateString() inicioPlan?: string;
  @IsOptional() @IsDateString() finPlan?: string;
  @IsOptional() @IsString() observaciones?: string;
}

export class UpdateFotoDto {
  @ValidateIf((o) => o.fotoUrl !== null)
  @IsString()
  fotoUrl: string | null;
}

export class RegistrarIngresoDto {
  @IsOptional()
  @IsInt()
  idSede?: number;
}

export class CreateSocioDto {
  @IsNumberString()
  dni: string;

  @IsString()
  nombre: string;

  @IsString()
  apellido: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  mail?: string;

  @IsOptional()
  @IsNumberString()
  telefono?: string;

  @IsOptional()
  @IsInt()
  idMembresia?: number;

  @IsOptional()
  @IsNumberString()
  clasesRestantes?: string;

  @IsOptional()
  @IsNumberString()
  deuda?: string;

  @IsOptional()
  @IsString()
  idProfesor?: string;

  @IsOptional()
  @IsDateString()
  inicioPlan?: string;

  @IsOptional()
  @IsDateString()
  finPlan?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
