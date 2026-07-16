import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ejercicio } from './ejercicio.entity';
import { ZonaMuscular } from './zona-muscular.entity';
import { EjerciciosService } from './ejercicios.service';
import { EjerciciosController } from './ejercicios.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Ejercicio, ZonaMuscular])],
  controllers: [EjerciciosController],
  providers: [EjerciciosService],
})
export class EjerciciosModule {}
