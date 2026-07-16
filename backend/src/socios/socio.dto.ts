import { IsInt, IsNumberString, IsOptional, IsString } from 'class-validator';

export class CreateMembresiaDto {
  @IsString() nombreMembresia: string;
}

export class UpdateSocioDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsString() apellido?: string;
  @IsOptional() @IsString() direccion?: string;
  @IsOptional() @IsString() mail?: string;
  @IsOptional() @IsNumberString() telefono?: string;
  @IsOptional() @IsInt() idMembresia?: number;
  @IsOptional() @IsNumberString() clasesRestantes?: string;
  @IsOptional() @IsNumberString() deuda?: string;
  @IsOptional() @IsString() idProfesor?: string;
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
}
