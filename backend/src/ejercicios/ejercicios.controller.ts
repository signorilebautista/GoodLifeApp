import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { EjerciciosService } from './ejercicios.service';
import { CreateEjercicioDto, UpdateEjercicioDto } from './ejercicio.dto';

@Controller('ejercicios')
export class EjerciciosController {
  constructor(private readonly service: EjerciciosService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('zonas')
  findZonas() {
    return this.service.findZonas();
  }

  @Post()
  create(@Body() dto: CreateEjercicioDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEjercicioDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
