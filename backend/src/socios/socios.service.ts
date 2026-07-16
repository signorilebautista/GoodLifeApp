import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Socio } from './socio.entity';
import { Membresia } from './membresia.entity';
import { DeudaSocio } from './deuda-socio.entity';
import { PlanSocio } from './plan-socio.entity';
import { LogBaja } from './log-baja.entity';
import { LogIngreso } from './log-ingreso.entity';
import { CreateSocioDto, UpdateSocioDto } from './socio.dto';
import { MailService } from '../mail/mail.service';

export interface SocioConDetalle {
  dni: string;
  nombre: string;
  apellido: string;
  direccion: string;
  mail: string;
  telefono: string;
  idMembresia: number;
  clasesRestantes: string;
  plan: string | null;
  deuda: string | null;
  idProfesor: string | null;
}

@Injectable()
export class SociosService {
  constructor(
    @InjectRepository(Socio)
    private readonly sociosRepository: Repository<Socio>,
    @InjectRepository(Membresia)
    private readonly membresiaRepository: Repository<Membresia>,
    @InjectRepository(DeudaSocio)
    private readonly deudaRepository: Repository<DeudaSocio>,
    @InjectRepository(PlanSocio)
    private readonly planRepository: Repository<PlanSocio>,
    @InjectRepository(LogBaja)
    private readonly logBajaRepository: Repository<LogBaja>,
    @InjectRepository(LogIngreso)
    private readonly logIngresoRepository: Repository<LogIngreso>,
    private readonly mailService: MailService,
  ) {}

  findAll(): Promise<SocioConDetalle[]> {
    return this.sociosRepository
      .createQueryBuilder('s')
      .leftJoin(Membresia, 'm', 'm."idMembresia" = s."idMembresia"')
      .leftJoin(DeudaSocio, 'd', 'd."DNI" = s."DNI"')
      .select('s."DNI"', 'dni')
      .addSelect('s.nombre', 'nombre')
      .addSelect('s.apellido', 'apellido')
      .addSelect('s.direccion', 'direccion')
      .addSelect('s.mail', 'mail')
      .addSelect('s.telefono', 'telefono')
      .addSelect('s."idMembresia"', 'idMembresia')
      .addSelect('s."clasesRestantes"', 'clasesRestantes')
      .addSelect('m."nombreMembresia"', 'plan')
      .addSelect('d."Deuda"', 'deuda')
      .addSelect('s."idProfesor"', 'idProfesor')
      .orderBy('s."DNI"', 'ASC')
      .getRawMany();
  }

  findMembresias(): Promise<Membresia[]> {
    return this.membresiaRepository.find({ order: { idMembresia: 'ASC' } });
  }

  async create(dto: CreateSocioDto): Promise<Socio> {
    const socio = this.sociosRepository.create({
      dni: dto.dni,
      nombre: dto.nombre,
      apellido: dto.apellido,
      direccion: dto.direccion,
      mail: dto.mail,
      telefono: dto.telefono,
      idMembresia: dto.idMembresia,
      clasesRestantes: dto.clasesRestantes,
      idProfesor: dto.idProfesor,
    });
    const saved = await this.sociosRepository.save(socio);

    if (dto.deuda !== undefined) {
      await this.deudaRepository.save(
        this.deudaRepository.create({ dni: dto.dni, deuda: dto.deuda }),
      );
    }

    return saved;
  }

  async createAndInvite(dto: CreateSocioDto): Promise<{ socio: Socio; emailSent: boolean }> {
    const socio = await this.create(dto);
    let emailSent = false;
    if (dto.mail) {
      const tempPassword = Math.random().toString(36).slice(-8);
      try {
        await this.mailService.sendWelcome(dto.mail, dto.nombre, tempPassword);
        emailSent = true;
      } catch (_) {
        emailSent = false;
      }
    }
    return { socio, emailSent };
  }

  async createMembresia(nombreMembresia: string): Promise<Membresia> {
    const m = this.membresiaRepository.create({ nombreMembresia });
    return this.membresiaRepository.save(m);
  }

  async deleteMembresia(id: number): Promise<void> {
    await this.membresiaRepository.delete({ idMembresia: id });
  }

  async updateMembresia(id: number, body: { nombreMembresia?: string }): Promise<Membresia> {
    const m = await this.membresiaRepository.findOne({ where: { idMembresia: id } });
    if (!m) throw new NotFoundException(`Membresía ${id} no encontrada`);
    if (body.nombreMembresia !== undefined) m.nombreMembresia = body.nombreMembresia;
    return this.membresiaRepository.save(m);
  }

  async update(dni: string, dto: UpdateSocioDto): Promise<SocioConDetalle> {
    const socio = await this.sociosRepository.findOne({ where: { dni } });
    if (!socio) throw new NotFoundException(`Socio con DNI ${dni} no encontrado`);

    const fields: Partial<Socio> = {};
    if (dto.nombre !== undefined) fields.nombre = dto.nombre;
    if (dto.apellido !== undefined) fields.apellido = dto.apellido;
    if (dto.direccion !== undefined) fields.direccion = dto.direccion;
    if (dto.mail !== undefined) fields.mail = dto.mail;
    if (dto.telefono !== undefined) fields.telefono = dto.telefono;
    if (dto.idMembresia !== undefined) fields.idMembresia = dto.idMembresia;
    if (dto.clasesRestantes !== undefined) fields.clasesRestantes = dto.clasesRestantes;
    if (dto.idProfesor !== undefined) fields.idProfesor = dto.idProfesor;

    if (Object.keys(fields).length) await this.sociosRepository.update({ dni }, fields);

    if (dto.deuda !== undefined) {
      const existing = await this.deudaRepository.findOne({ where: { dni } });
      if (existing) await this.deudaRepository.update({ dni }, { deuda: dto.deuda });
      else await this.deudaRepository.save(this.deudaRepository.create({ dni, deuda: dto.deuda }));
    }

    const [updated] = await this.findAll().then(list => list.filter(s => s.dni === dni));
    return updated;
  }

  async registrarIngreso(dni: string): Promise<{ ok: boolean; nombre: string; apellido: string; clasesRestantes: number; mensaje: string }> {
    const socio = await this.sociosRepository.findOne({ where: { dni } });
    if (!socio) throw new NotFoundException(`Socio con DNI ${dni} no encontrado`);

    const clases = Number(socio.clasesRestantes ?? 0);
    const nombre = socio.nombre;
    const apellido = socio.apellido;

    if (clases <= 0) {
      return { ok: false, nombre, apellido, clasesRestantes: 0, mensaje: `${nombre} ${apellido} no tiene clases restantes.` };
    }

    const nuevasClases = clases - 1;
    await this.sociosRepository.update({ dni }, { clasesRestantes: String(nuevasClases) });
    await this.logIngresoRepository.save(this.logIngresoRepository.create({ dniSocio: dni }));
    return { ok: true, nombre, apellido, clasesRestantes: nuevasClases, mensaje: `Ingreso registrado. Le quedan ${nuevasClases} clase${nuevasClases === 1 ? '' : 's'}.` };
  }

  async remove(dni: string): Promise<void> {
    await this.logBajaRepository.save(this.logBajaRepository.create({ dniSocio: dni }));
    await this.sociosRepository.manager.transaction(async (manager) => {
      await manager.query('DELETE FROM "Turno-Socio" WHERE "DNISocio" = $1', [dni]);
      await manager.query('DELETE FROM "Socios-Entrenamiento" WHERE "DNISocios" = $1', [dni]);
      await manager.query('DELETE FROM "Deuda Socios" WHERE "DNI" = $1', [dni]);
      await manager.delete(PlanSocio, { dniSocio: dni });
      const result = await manager.delete(Socio, { dni });
      if (!result.affected) {
        throw new NotFoundException(`Socio con DNI ${dni} no encontrado`);
      }
    });
  }

  async getPlan(dniSocio: string): Promise<object | null> {
    const row = await this.planRepository.findOne({ where: { dniSocio } });
    return row?.plan ?? null;
  }

  async savePlan(dniSocio: string, plan: object): Promise<void> {
    await this.planRepository.upsert({ dniSocio, plan }, ['dniSocio']);
  }
}
