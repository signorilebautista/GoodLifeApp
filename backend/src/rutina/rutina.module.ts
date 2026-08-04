import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistroPeso } from './registro-peso.entity';
import { RutinaService } from './rutina.service';
import { RutinaController } from './rutina.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RegistroPeso])],
  controllers: [RutinaController],
  providers: [RutinaService],
})
export class RutinaModule {}
