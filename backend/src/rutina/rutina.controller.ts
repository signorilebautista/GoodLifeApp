import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { RutinaService } from './rutina.service';

@Controller('rutina')
export class RutinaController {
  constructor(private readonly service: RutinaService) {}

  @Post('peso')
  guardarPeso(
    @Body() body: { usuarioId: string; ejercicioId: number; peso: number },
  ) {
    return this.service.guardarPeso(body.usuarioId, body.ejercicioId, body.peso);
  }

  @Get('historial')
  getHistorial(
    @Query('usuarioId') usuarioId: string,
    @Query('ejercicioId') ejercicioId: string,
  ) {
    return this.service.getHistorial(usuarioId, Number(ejercicioId));
  }

  @Get('pesos-actuales')
  getPesosActuales(@Query('usuarioId') usuarioId: string) {
    return this.service.getPesosActuales(usuarioId);
  }
}
