import { Body, Controller, Delete, Get, HttpException, Param, Patch, Post, Put } from '@nestjs/common';
import { SociosService } from './socios.service';
import { CreateMembresiaDto, CreateSocioDto, LoginSocioDto, RegistrarIngresoDto, UpdateFotoDto, UpdateSocioDto } from './socio.dto';

@Controller('socios')
export class SociosController {
  constructor(private readonly sociosService: SociosService) {}

  @Post('login')
  loginPorDni(@Body() dto: LoginSocioDto) {
    return this.sociosService.loginPorDni(dto.dni);
  }

  @Get()
  findAll() {
    return this.sociosService.findAll();
  }

  @Get('membresias')
  findMembresias() {
    return this.sociosService.findMembresias();
  }

  @Get('vencimientos')
  getVencimientos() {
    return this.sociosService.getVencimientos();
  }

  @Get('ingresos/recientes')
  getIngresosRecientes() {
    return this.sociosService.getIngresosRecientes();
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
      return await this.sociosService.createMembresia(dto.nombreMembresia, dto.cantidadClases, dto.precio);
    } catch {
      throw new HttpException('No se pudo crear el plan. Probá de nuevo.', 500);
    }
  }

  @Patch('membresias/:id')
  updateMembresia(@Param('id') id: string, @Body() body: { nombreMembresia?: string; cantidadClases?: number; precio?: number }) {
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

  @Patch(':dni/ejercicio-peso')
  updateEjercicioPeso(
    @Param('dni') dni: string,
    @Body() body: { idEjercicio: number; peso: number },
  ) {
    return this.sociosService.updateEjercicioPeso(dni, body.idEjercicio, body.peso);
  }

  @Get(':dni/examen')
  getExamen(@Param('dni') dni: string) {
    return this.sociosService.getExamen(dni);
  }

  @Put(':dni/examen')
  saveExamen(@Param('dni') dni: string, @Body() body: { examen: object }) {
    return this.sociosService.saveExamen(dni, body.examen);
  }

  @Patch(':dni')
  update(@Param('dni') dni: string, @Body() dto: UpdateSocioDto) {
    return this.sociosService.update(dni, dto);
  }

  @Patch(':dni/ingreso')
  registrarIngreso(@Param('dni') dni: string, @Body() dto: RegistrarIngresoDto) {
    return this.sociosService.registrarIngreso(dni, dto.idSede);
  }

  @Patch(':dni/foto')
  updateFoto(@Param('dni') dni: string, @Body() dto: UpdateFotoDto) {
    return this.sociosService.updateFoto(dni, dto.fotoUrl);
  }

  @Get(':dni/pagos')
  getPagos(@Param('dni') dni: string) {
    return this.sociosService.getPagos(dni);
  }

  @Patch(':dni/pago')
  registrarPago(@Param('dni') dni: string, @Body() body: { monto: number; diasVigencia?: number; soloDeuda?: boolean }) {
    return this.sociosService.registrarPago(dni, body.monto ?? 0, body.diasVigencia ?? 30, body.soloDeuda ?? false);
  }

  @Delete(':dni')
  remove(@Param('dni') dni: string) {
    return this.sociosService.remove(dni);
  }
}
