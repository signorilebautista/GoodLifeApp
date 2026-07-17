import { ConflictException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Turnero } from './turnero.entity';
import { TurneroProfesor } from './turnero-profesor.entity';
import { TurnoSocio } from './turno-socio.entity';
import { Profesor } from './profesor.entity';
import { Sede } from './sede.entity';
import { Actividad } from './actividad.entity';
import { CreateTurnoDto, UpdateTurnoDto } from './turno.dto';
import { MailService } from '../mail/mail.service';
import { AuthService } from '../auth/auth.service';

export interface TurnoConDetalle {
  dia: string;
  horario: string;
  horaFin: string | null;
  idSede: number;
  sede: string | null;
  estado: boolean | null;
  cantReservas: string | null;
  idActividad: number | null;
  actividad: string | null;
  profesorDni: string | null;
  profesorNombre: string | null;
  profesorApellido: string | null;
}

@Injectable()
export class TurneroService implements OnModuleInit {
  private readonly logger = new Logger(TurneroService.name);

  constructor(
    @InjectRepository(Turnero)
    private readonly turneroRepository: Repository<Turnero>,
    @InjectRepository(TurneroProfesor)
    private readonly turneroProfesorRepository: Repository<TurneroProfesor>,
    @InjectRepository(Profesor)
    private readonly profesorRepository: Repository<Profesor>,
    @InjectRepository(Sede)
    private readonly sedeRepository: Repository<Sede>,
    @InjectRepository(Actividad)
    private readonly actividadRepository: Repository<Actividad>,
    private readonly mailService: MailService,
    private readonly authService: AuthService,
  ) {}

  /** Corre la limpieza también al arrancar el server, sin esperar a la próxima hora en punto. */
  async onModuleInit(): Promise<void> {
    await this.removeExpired();
  }

  findAll(filters: { desde?: string; hasta?: string; profesor?: string }): Promise<TurnoConDetalle[]> {
    const qb = this.turneroRepository
      .createQueryBuilder('t')
      .leftJoin(
        TurneroProfesor,
        'tp',
        'tp.dia = t.dia AND tp.horario = t.horario AND tp."idSede" = t."idSede"',
      )
      .leftJoin(Profesor, 'p', 'p."DNI" = tp."DNIProfe"')
      .leftJoin(Sede, 's', 's."idSede" = t."idSede"')
      .leftJoin(Actividad, 'a', 'a."idActividad" = t."idActividad"')
      .select('t.dia', 'dia')
      .addSelect('t.horario', 'horario')
      .addSelect('t."horaFin"', 'horaFin')
      .addSelect('t."idSede"', 'idSede')
      .addSelect('s."nombreSede"', 'sede')
      .addSelect('t.estado', 'estado')
      .addSelect('t."cantReservas"', 'cantReservas')
      .addSelect('t."idActividad"', 'idActividad')
      .addSelect('a.actividad', 'actividad')
      .addSelect('p."DNI"', 'profesorDni')
      .addSelect('p.nombre', 'profesorNombre')
      .addSelect('p.apellido', 'profesorApellido');

    if (filters.desde) {
      qb.andWhere('t.dia >= :desde', { desde: filters.desde });
    }
    if (filters.hasta) {
      qb.andWhere('t.dia <= :hasta', { hasta: filters.hasta });
    }
    if (filters.profesor) {
      qb.andWhere('(p.nombre ILIKE :profesor OR p.apellido ILIKE :profesor)', {
        profesor: `%${filters.profesor}%`,
      });
    }

    qb.orderBy('t.dia', 'ASC').addOrderBy('t.horario', 'ASC');
    return qb.getRawMany();
  }

  findProfesores(): Promise<Profesor[]> {
    return this.profesorRepository.find({ order: { apellido: 'ASC' } });
  }

  findSedes(): Promise<Sede[]> {
    return this.sedeRepository.find({ order: { idSede: 'ASC' } });
  }

  findActividades(): Promise<Actividad[]> {
    return this.actividadRepository.find({ order: { idActividad: 'ASC' } });
  }

  async createSede(dto: { nombre: string; direccion?: string }): Promise<Sede> {
    await this.sedeRepository.query(
      `SELECT setval(pg_get_serial_sequence('"Sedes"', 'idSede'), COALESCE((SELECT MAX("idSede") FROM "Sedes"), 0))`,
    );
    const result = await this.sedeRepository.query(
      `INSERT INTO "Sedes" ("nombreSede", "direccion") VALUES ($1, $2) RETURNING *`,
      [dto.nombre, dto.direccion ?? null],
    );
    return result[0];
  }

  async deleteSede(id: number): Promise<void> {
    await this.sedeRepository.delete({ idSede: id });
  }

  async createProfesor(dto: { dni: string; nombre: string; apellido: string; telefono?: string; mail?: string; idSede?: string }): Promise<Profesor> {
    const profesor = this.profesorRepository.create({
      dni: dto.dni,
      nombre: dto.nombre,
      apellido: dto.apellido,
      telefono: dto.telefono ?? null,
      mail: dto.mail ?? null,
      idSede: dto.idSede ?? null,
    });
    const saved = await this.profesorRepository.save(profesor);

    if (dto.mail) {
      try {
        const tempPassword = this.authService.generateTempPassword();
        await this.authService.createUsuario(dto.mail, `${dto.nombre} ${dto.apellido}`, dto.dni, tempPassword);
        await this.mailService.sendWelcome(dto.mail, dto.nombre, tempPassword);
      } catch (err) {
        this.logger.error(`No se pudo crear usuario/enviar mail al profesor ${dto.dni}: ${err?.message ?? err}`);
      }
    }

    return saved;
  }

  async deleteProfesor(dni: string): Promise<void> {
    const prof = await this.profesorRepository.findOne({ where: { dni } });
    await this.turneroProfesorRepository.delete({ dniProfe: dni });
    await this.profesorRepository.manager.query(`DELETE FROM "Profesores-Sedes" WHERE "DNI" = $1`, [dni]);
    await this.profesorRepository.delete({ dni });
    if (prof?.mail) {
      await this.authService.deleteByMail(prof.mail).catch(() => {});
    }
  }

  async reenviarMailProfesor(dni: string): Promise<{ ok: boolean }> {
    const prof = await this.profesorRepository.findOne({ where: { dni } });
    if (!prof) throw new NotFoundException(`Profesor con DNI ${dni} no encontrado`);
    if (!prof.mail) throw new Error('El profesor no tiene email registrado');
    const tempPassword = this.authService.generateTempPassword();
    await this.authService.createUsuario(prof.mail, prof.nombre, dni, tempPassword);
    await this.mailService.sendWelcome(prof.mail, prof.nombre, tempPassword);
    return { ok: true };
  }

  async updateSede(id: number, body: { nombreSede?: string; direccion?: string }): Promise<Sede> {
    const sede = await this.sedeRepository.findOne({ where: { idSede: id } });
    if (!sede) throw new NotFoundException(`Sede ${id} no encontrada`);
    if (body.nombreSede !== undefined) sede.nombreSede = body.nombreSede;
    if (body.direccion !== undefined) sede.direccion = body.direccion;
    return this.sedeRepository.save(sede);
  }

  async updateProfesor(dni: string, body: { nombre?: string; apellido?: string; telefono?: string; mail?: string; idSede?: string }): Promise<Profesor> {
    const prof = await this.profesorRepository.findOne({ where: { dni } });
    if (!prof) throw new NotFoundException(`Profesor con DNI ${dni} no encontrado`);
    if (body.nombre !== undefined) prof.nombre = body.nombre;
    if (body.apellido !== undefined) prof.apellido = body.apellido;
    if (body.telefono !== undefined) prof.telefono = body.telefono;
    if (body.mail !== undefined) prof.mail = body.mail;
    if (body.idSede !== undefined) prof.idSede = body.idSede;
    return this.profesorRepository.save(prof);
  }

  async create(dto: CreateTurnoDto): Promise<void> {
    try {
      await this.turneroRepository.manager.transaction(async (manager) => {
        await manager.save(
          manager.create(Turnero, {
            dia: dto.dia,
            horario: dto.horario,
            horaFin: dto.horaFin ?? null,
            idSede: dto.idSede,
            idActividad: dto.idActividad,
            cantReservas: dto.cantReservas ?? '0',
            estado: dto.estado ?? true,
          }),
        );
        await manager.save(
          manager.create(TurneroProfesor, {
            dniProfe: dto.dniProfesor,
            dia: dto.dia,
            horario: dto.horario,
            idSede: dto.idSede,
          }),
        );
      });
    } catch (err) {
      if (this.isUniqueViolation(err)) {
        throw new ConflictException('Ya existe un turno para esa fecha, horario y sede');
      }
      throw err;
    }
  }

  private isUniqueViolation(err: unknown): boolean {
    return typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505';
  }

  async update(dto: UpdateTurnoDto): Promise<void> {
    try {
      await this.runUpdate(dto);
    } catch (err) {
      if (this.isUniqueViolation(err)) {
        throw new ConflictException('Ya existe un turno para esa fecha, horario y sede');
      }
      throw err;
    }
  }

  private async runUpdate(dto: UpdateTurnoDto): Promise<void> {
    await this.turneroRepository.manager.transaction(async (manager) => {
      const existing = await manager.findOne(Turnero, {
        where: { dia: dto.oldDia, horario: dto.oldHorario, idSede: dto.oldIdSede },
      });
      if (!existing) {
        throw new NotFoundException('Turno no encontrado');
      }

      const keyChanged =
        dto.oldDia !== dto.dia || dto.oldHorario !== dto.horario || dto.oldIdSede !== dto.idSede;

      if (keyChanged) {
        await manager.query(
          'UPDATE "Turno-Socio" SET dia = $1, horario = $2, "idSede" = $3 WHERE dia = $4 AND horario = $5 AND "idSede" = $6',
          [dto.dia, dto.horario, dto.idSede, dto.oldDia, dto.oldHorario, dto.oldIdSede],
        );
        await manager.delete(TurneroProfesor, {
          dia: dto.oldDia,
          horario: dto.oldHorario,
          idSede: dto.oldIdSede,
        });
        await manager.delete(Turnero, { dia: dto.oldDia, horario: dto.oldHorario, idSede: dto.oldIdSede });
        await manager.save(
          manager.create(Turnero, {
            dia: dto.dia,
            horario: dto.horario,
            horaFin: dto.horaFin ?? null,
            idSede: dto.idSede,
            idActividad: dto.idActividad,
            cantReservas: dto.cantReservas ?? existing.cantReservas,
            estado: dto.estado ?? existing.estado,
          }),
        );
        await manager.save(
          manager.create(TurneroProfesor, {
            dniProfe: dto.dniProfesor,
            dia: dto.dia,
            horario: dto.horario,
            idSede: dto.idSede,
          }),
        );
      } else {
        await manager.update(
          Turnero,
          { dia: dto.dia, horario: dto.horario, idSede: dto.idSede },
          {
            horaFin: dto.horaFin ?? null,
            idActividad: dto.idActividad,
            cantReservas: dto.cantReservas ?? existing.cantReservas,
            estado: dto.estado ?? existing.estado,
          },
        );
        await manager.delete(TurneroProfesor, { dia: dto.dia, horario: dto.horario, idSede: dto.idSede });
        await manager.save(
          manager.create(TurneroProfesor, {
            dniProfe: dto.dniProfesor,
            dia: dto.dia,
            horario: dto.horario,
            idSede: dto.idSede,
          }),
        );
      }
    });
  }

  async remove(dia: string, horario: string, idSede: number): Promise<void> {
    await this.turneroRepository.manager.transaction(async (manager) => {
      await manager.delete(TurnoSocio, { dia, horario, idSede });
      await manager.delete(TurneroProfesor, { dia, horario, idSede });
      const result = await manager.delete(Turnero, { dia, horario, idSede });
      if (!result.affected) {
        throw new NotFoundException('Turno no encontrado');
      }
    });
  }

  /**
   * Borra los turnos cuya fecha+hora de fin (o, si no tiene, hora de inicio)
   * ya pasó hace más de 24hs. Corre cada hora; el criterio se evalúa en SQL
   * para no depender de la zona horaria del proceso Node.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async removeExpired(): Promise<void> {
    await this.turneroRepository.manager.transaction(async (manager) => {
      const expired: { dia: string; horario: string; idSede: number }[] = await manager.query(
        `SELECT dia, horario, "idSede" AS "idSede" FROM "Turnero"
         WHERE (dia + COALESCE("horaFin", horario)) < (NOW() - INTERVAL '24 hours')`,
      );
      if (expired.length === 0) return;

      for (const t of expired) {
        await manager.delete(TurnoSocio, { dia: t.dia, horario: t.horario, idSede: t.idSede });
        await manager.delete(TurneroProfesor, { dia: t.dia, horario: t.horario, idSede: t.idSede });
        await manager.delete(Turnero, { dia: t.dia, horario: t.horario, idSede: t.idSede });
      }
      this.logger.log(`Turnos vencidos eliminados: ${expired.length}`);
    });
  }
}
