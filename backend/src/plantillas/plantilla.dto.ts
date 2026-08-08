import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreatePlantillaDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsObject()
  plan: object;
}

export class UpdatePlantillaDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsString() descripcion?: string;
  @IsOptional() @IsObject() plan?: object;
}
