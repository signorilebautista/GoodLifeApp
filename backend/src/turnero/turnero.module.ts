import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Turnero } from './turnero.entity';
import { TurneroProfesor } from './turnero-profesor.entity';
import { TurnoSocio } from './turno-socio.entity';
import { Profesor } from './profesor.entity';
import { Sede } from './sede.entity';
import { TurneroService } from './turnero.service';
import { TurneroController } from './turnero.controller';
import { MailModule } from '../mail/mail.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Turnero, TurneroProfesor, TurnoSocio, Profesor, Sede]),
    MailModule,
    AuthModule,
  ],
  controllers: [TurneroController],
  providers: [TurneroService],
})
export class TurneroModule {}
