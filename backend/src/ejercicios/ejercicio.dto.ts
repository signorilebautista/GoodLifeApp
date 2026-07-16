import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateEjercicioDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsString() videoUrl?: string;
  @IsOptional() @IsNumber() idZona?: number;
}

export class CreateEjercicioDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsNumber()
  idZona?: number;

  @IsOptional()
  @IsString()
  nuevaZona?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;
}
