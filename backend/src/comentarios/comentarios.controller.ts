import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ComentariosService } from './comentarios.service';
import { CreateComentarioDto } from './comentario.dto';

@Controller('comentarios')
export class ComentariosController {
  constructor(private readonly service: ComentariosService) {}

  @Get()
  findAll(@Query('leido') leido?: string, @Query('dniSocio') dniSocio?: string) {
    return this.service.findAll({ leido, dniSocio });
  }

  @Post()
  create(@Body() dto: CreateComentarioDto) {
    return this.service.create(dto);
  }

  @Patch(':id/leido')
  marcarLeido(@Param('id', ParseIntPipe) id: number) {
    return this.service.marcarLeido(id);
  }
}
