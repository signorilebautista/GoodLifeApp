import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlantillaEjercicios } from './plantilla.entity';
import { PlantillasService } from './plantillas.service';
import { PlantillasController } from './plantillas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PlantillaEjercicios])],
  controllers: [PlantillasController],
  providers: [PlantillasService],
})
export class PlantillasModule {}
