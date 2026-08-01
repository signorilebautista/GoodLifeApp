import { Body, Controller, Delete, Get, HttpException, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { TurneroService } from './turnero.service';
import { CreateProfesorDto, CreateSedeDto, CreateTurnoDto, UpdateTurnoDto } from './turno.dto';

@Controller('turnero')
export class TurneroController {
  constructor(private readonly turneroService: TurneroService) {}

  @Get()
  findAll(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('profesor') profesor?: string,
  ) {
    return this.turneroService.findAll({ desde, hasta, profesor });
  }

  @Get('profesores')
  findProfesores() {
    return this.turneroService.findProfesores();
  }

  @Get('sedes')
  findSedes() {
    return this.turneroService.findSedes();
  }

  @Post('sedes')
  async createSede(@Body() dto: CreateSedeDto) {
    try {
      return await this.turneroService.createSede(dto);
    } catch (err) {
      throw new HttpException(String(err?.message ?? err), 500);
    }
  }

  @Patch('sedes/:id')
  updateSede(@Param('id', ParseIntPipe) id: number, @Body() body: { nombreSede?: string; direccion?: string }) {
    return this.turneroService.updateSede(id, body);
  }

  @Delete('sedes/:id')
  deleteSede(@Param('id', ParseIntPipe) id: number) {
    return this.turneroService.deleteSede(id);
  }

  @Post('profesores')
  async createProfesor(@Body() dto: CreateProfesorDto) {
    try {
      return await this.turneroService.createProfesor(dto);
    } catch (err) {
      throw new HttpException(String(err?.message ?? err), 500);
    }
  }

  @Patch('profesores/:dni')
  updateProfesor(@Param('dni') dni: string, @Body() body: { nombre?: string; apellido?: string; telefono?: string; mail?: string; idSede?: string }) {
    return this.turneroService.updateProfesor(dni, body);
  }

  @Post('profesores/:dni/reenviar-mail')
  async reenviarMail(@Param('dni') dni: string) {
    try {
      return await this.turneroService.reenviarMailProfesor(dni);
    } catch (err) {
      throw new HttpException(String(err?.message ?? err), 500);
    }
  }

  @Delete('profesores/:dni')
  deleteProfesor(@Param('dni') dni: string) {
    return this.turneroService.deleteProfesor(dni);
  }

  @Post()
  create(@Body() dto: CreateTurnoDto) {
    return this.turneroService.create(dto);
  }

  @Put()
  update(@Body() dto: UpdateTurnoDto) {
    return this.turneroService.update(dto);
  }

  @Delete()
  remove(
    @Query('dia') dia: string,
    @Query('horario') horario: string,
    @Query('idSede') idSede: string,
  ) {
    return this.turneroService.remove(dia, horario, Number(idSede));
  }
}
