import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Socio } from './socio.entity';
import { Membresia } from './membresia.entity';
import { DeudaSocio } from './deuda-socio.entity';
import { PlanSocio } from './plan-socio.entity';
import { ExamenSocio } from './examen-socio.entity';
import { LogBaja } from './log-baja.entity';
import { LogIngreso } from './log-ingreso.entity';
import { PagoSocio } from './pago-socio.entity';
import { SociosService } from './socios.service';
import { SociosController } from './socios.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([Socio, Membresia, DeudaSocio, PlanSocio, ExamenSocio, LogBaja, LogIngreso, PagoSocio]), MailModule],
  controllers: [SociosController],
  providers: [SociosService],
})
export class SociosModule {}
