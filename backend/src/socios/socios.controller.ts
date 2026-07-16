import { Body, Controller, Delete, Get, HttpException, Param, Patch, Post, Put } from '@nestjs/common';
import { SociosService } from './socios.service';
import { CreateMembresiaDto, CreateSocioDto, UpdateSocioDto } from './socio.dto';

@Controller('socios')
export class SociosController {
  constructor(private readonly sociosService: SociosService) {}

  @Get()
  findAll() {
    return this.sociosService.findAll();
  }

  @Get('membresias')
  findMembresias() {
    return this.sociosService.findMembresias();
  }

  @Post()
  create(@Body() dto: CreateSocioDto) {
    return this.sociosService.create(dto);
  }

  @Post('invite')
  invite(@Body() dto: CreateSocioDto) {
    return this.sociosService.createAndInvite(dto);
  }

  @Post('membresias')
  async createMembresia(@Body() dto: CreateMembresiaDto) {
    try {
      return await this.sociosService.createMembresia(dto.nombreMembresia);
    } catch (err) {
      throw new HttpException(String(err?.message ?? err), 500);
    }
  }

  @Patch('membresias/:id')
  updateMembresia(@Param('id') id: string, @Body() body: { nombreMembresia?: string }) {
    return this.sociosService.updateMembresia(Number(id), body);
  }

  @Delete('membresias/:id')
  deleteMembresia(@Param('id') id: string) {
    return this.sociosService.deleteMembresia(Number(id));
  }

  @Get(':dni/plan')
  getPlan(@Param('dni') dni: string) {
    return this.sociosService.getPlan(dni);
  }

  @Put(':dni/plan')
  savePlan(@Param('dni') dni: string, @Body() body: { plan: object }) {
    return this.sociosService.savePlan(dni, body.plan);
  }

  @Patch(':dni')
  update(@Param('dni') dni: string, @Body() dto: UpdateSocioDto) {
    return this.sociosService.update(dni, dto);
  }

  @Patch(':dni/ingreso')
  registrarIngreso(@Param('dni') dni: string) {
    return this.sociosService.registrarIngreso(dni);
  }

  @Delete(':dni')
  remove(@Param('dni') dni: string) {
    return this.sociosService.remove(dni);
  }
}
