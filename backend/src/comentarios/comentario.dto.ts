import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateComentarioDto {
  @IsString()
  @IsNotEmpty()
  dniSocio: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  texto: string;
}
