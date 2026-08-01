import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Socio } from './socio.entity';
import { Membresia } from './membresia.entity';
import { DeudaSocio } from './deuda-socio.entity';
import { PlanSocio } from './plan-socio.entity';
import { PagoSocio } from './pago-socio.entity';
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
  fechaUltimoPago: string | null;
  proximoPago: string | null;
}

export interface SocioVencimiento {
  dni: string;
  nombre: string;
  apellido: string;
  plan: string | null;
  precioPlan: number | null;
  deuda: number | null;
  fechaUltimoPago: string | null;
  ultimoMonto: number | null;
  proximoPago: string | null;
  estado: 'ok' | 'proximo' | 'vencido' | 'sinFecha';
}

export interface RegistrarPagoResult {
  ok: boolean;
  nuevaDeuda: number;
  mensaje: string;
  clasesRestantes?: string;
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
    @InjectRepository(PagoSocio)
    private readonly pagoRepository: Repository<PagoSocio>,
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
      .addSelect('s."fechaUltimoPago"', 'fechaUltimoPago')
      .addSelect('s."proximoPago"', 'proximoPago')
      .where('s."estado" = :estado', { estado: 'A' })
      .orderBy('s."DNI"', 'ASC')
      .getRawMany();
  }

  findMembresias(): Promise<Membresia[]> {
    return this.membresiaRepository.find({ order: { idMembresia: 'ASC' } });
  }

  async create(dto: CreateSocioDto): Promise<Socio> {
    // Si ya existe con estado 'B', reactivarlo en lugar de insertar duplicado
    const existing = await this.sociosRepository.findOne({ where: { dni: dto.dni } });
    if (existing) {
      await this.sociosRepository.update({ dni: dto.dni }, {
        nombre: dto.nombre,
        apellido: dto.apellido,
        direccion: dto.direccion ?? existing.direccion,
        mail: dto.mail ?? existing.mail,
        telefono: dto.telefono ?? existing.telefono,
        idMembresia: dto.idMembresia ?? existing.idMembresia,
        clasesRestantes: dto.clasesRestantes ?? existing.clasesRestantes,
        idProfesor: dto.idProfesor ?? existing.idProfesor,
        estado: 'A',
      });
      if (dto.deuda !== undefined) {
        const deuda = await this.deudaRepository.findOne({ where: { dni: dto.dni } });
        if (deuda) await this.deudaRepository.update({ dni: dto.dni }, { deuda: dto.deuda });
        else await this.deudaRepository.save(this.deudaRepository.create({ dni: dto.dni, deuda: dto.deuda }));
      }
      return this.sociosRepository.findOne({ where: { dni: dto.dni } });
    }

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
      estado: 'A',
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

  async createMembresia(nombreMembresia: string, cantidadClases?: number, precio?: number): Promise<Membresia> {
    const m = this.membresiaRepository.create({ nombreMembresia, cantidadClases: cantidadClases ?? null, precio: precio ?? null });
    return this.membresiaRepository.save(m);
  }

  async deleteMembresia(id: number): Promise<void> {
    await this.membresiaRepository.delete({ idMembresia: id });
  }

  async updateMembresia(id: number, body: { nombreMembresia?: string; cantidadClases?: number; precio?: number }): Promise<Membresia> {
    const m = await this.membresiaRepository.findOne({ where: { idMembresia: id } });
    if (!m) throw new NotFoundException(`Membresía ${id} no encontrada`);
    if (body.nombreMembresia !== undefined) m.nombreMembresia = body.nombreMembresia;
    if (body.cantidadClases !== undefined) m.cantidadClases = body.cantidadClases;
    if (body.precio !== undefined) m.precio = body.precio;
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
    if (dto.idMembresia !== undefined) {
      fields.idMembresia = dto.idMembresia;
      // Resetear clases restantes al cambiar de plan
      if (dto.clasesRestantes === undefined) {
        const nuevaMembresia = dto.idMembresia
          ? await this.membresiaRepository.findOne({ where: { idMembresia: dto.idMembresia } })
          : null;
        fields.clasesRestantes = nuevaMembresia?.cantidadClases != null
          ? String(nuevaMembresia.cantidadClases)
          : '0';
      }
    }
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
    const socio = await this.sociosRepository.findOne({ where: { dni } });
    if (!socio) throw new NotFoundException(`Socio con DNI ${dni} no encontrado`);

    // Registrar baja y sacar al socio de los turnos, pero conservar su registro
    await this.logBajaRepository.save(this.logBajaRepository.create({ dniSocio: dni }));
    await this.sociosRepository.manager.transaction(async (manager) => {
      await manager.query('DELETE FROM "Turno-Socio" WHERE "DNISocio" = $1', [dni]);
      await manager.update(Socio, { dni }, { estado: 'B' });
    });
  }

  async registrarPago(dni: string, monto: number, diasVigencia = 30, soloDeuda = false): Promise<RegistrarPagoResult> {
    const socio = await this.sociosRepository.findOne({ where: { dni } });
    if (!socio) throw new NotFoundException(`Socio con DNI ${dni} no encontrado`);

    const deudaRow = await this.deudaRepository.findOne({ where: { dni } });
    const deudaActual = Number(deudaRow?.deuda ?? 0);

    let nuevaDeuda: number;
    let membresia: Membresia | null = null;
    if (soloDeuda) {
      nuevaDeuda = deudaActual + monto;
    } else {
      membresia = socio.idMembresia
        ? await this.membresiaRepository.findOne({ where: { idMembresia: socio.idMembresia } })
        : null;
      const precio = Number(membresia?.precio ?? 0);
      nuevaDeuda = deudaActual + monto - precio;
    }

    // Actualizar deuda
    if (deudaRow) {
      await this.deudaRepository.update({ dni }, { deuda: String(nuevaDeuda) });
    } else {
      await this.deudaRepository.save(this.deudaRepository.create({ dni, deuda: String(nuevaDeuda) }));
    }

    // Registrar el pago
    await this.pagoRepository.save(this.pagoRepository.create({ dniSocio: dni, monto, diasVigencia: soloDeuda ? 0 : diasVigencia }));

    // Actualizar fechas y clases restantes solo si se paga la membresía
    if (!soloDeuda) {
      const hoy = new Date();
      const proximo = new Date(hoy);
      proximo.setDate(proximo.getDate() + diasVigencia);
      const toISO = (d: Date) => d.toISOString().slice(0, 10);
      const clasesRestantes = membresia?.cantidadClases != null
        ? String(membresia.cantidadClases)
        : undefined;
      await this.sociosRepository.update({ dni }, {
        fechaUltimoPago: toISO(hoy),
        proximoPago: toISO(proximo),
        ...(clasesRestantes !== undefined && { clasesRestantes }),
      });
    }

    let mensaje: string;
    if (nuevaDeuda > 0) {
      mensaje = soloDeuda
        ? `Pago de deuda registrado. Crédito a favor: $${nuevaDeuda.toLocaleString('es-AR')}.`
        : `Pago registrado. Crédito a favor: $${nuevaDeuda.toLocaleString('es-AR')}.`;
    } else if (nuevaDeuda === 0) {
      mensaje = soloDeuda ? 'Deuda saldada.' : 'Pago registrado. Cuenta al día.';
    } else {
      const falta = Math.abs(nuevaDeuda);
      mensaje = soloDeuda
        ? `Pago parcial de deuda. Falta abonar: $${falta.toLocaleString('es-AR')}.`
        : `Pago parcial registrado. Falta abonar: $${falta.toLocaleString('es-AR')}.`;
    }

    const clasesRestantesResult = (!soloDeuda && membresia?.cantidadClases != null)
      ? String(membresia.cantidadClases)
      : undefined;
    return { ok: true, nuevaDeuda, mensaje, ...(clasesRestantesResult !== undefined && { clasesRestantes: clasesRestantesResult }) };
  }

  async getPagos(dni: string): Promise<PagoSocio[]> {
    return this.pagoRepository.find({
      where: { dniSocio: dni },
      order: { fechaPago: 'DESC' },
    });
  }

  async getVencimientos(): Promise<SocioVencimiento[]> {
    const rows: {
      dni: string; nombre: string; apellido: string; plan: string | null;
      precioPlan: string | null; deuda: string | null;
      fechaUltimoPago: string | null; proximoPago: string | null;
    }[] = await this.sociosRepository
      .createQueryBuilder('s')
      .leftJoin(Membresia, 'm', 'm."idMembresia" = s."idMembresia"')
      .leftJoin(DeudaSocio, 'd', 'd."DNI" = s."DNI"')
      .select('s."DNI"', 'dni')
      .addSelect('s.nombre', 'nombre')
      .addSelect('s.apellido', 'apellido')
      .addSelect('m."nombreMembresia"', 'plan')
      .addSelect('m."precio"', 'precioPlan')
      .addSelect('d."Deuda"', 'deuda')
      .addSelect('s."fechaUltimoPago"', 'fechaUltimoPago')
      .addSelect('s."proximoPago"', 'proximoPago')
      .where('s."estado" = :estado', { estado: 'A' })
      .orderBy('s."proximoPago"', 'ASC', 'NULLS LAST')
      .addOrderBy('s.apellido', 'ASC')
      .getRawMany();

    // Obtener último monto de pago por socio (DISTINCT ON requiere SQL nativo)
    const ultimosPagos: { dniSocio: string; monto: string }[] = await this.pagoRepository.manager.query(
      `SELECT DISTINCT ON (p."DNISocio") p."DNISocio" AS "dniSocio", p.monto
       FROM "Pagos Socios" p
       ORDER BY p."DNISocio", p."fechaPago" DESC`
    );

    const montoMap = new Map(ultimosPagos.map(p => [p.dniSocio, Number(p.monto)]));

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const en7Dias = new Date(hoy);
    en7Dias.setDate(en7Dias.getDate() + 7);

    return rows.map(r => {
      let estado: SocioVencimiento['estado'] = 'sinFecha';
      if (r.proximoPago) {
        const fecha = new Date(r.proximoPago);
        if (fecha < hoy) estado = 'vencido';
        else if (fecha <= en7Dias) estado = 'proximo';
        else estado = 'ok';
      }
      return {
        ...r,
        precioPlan: r.precioPlan != null ? Number(r.precioPlan) : null,
        deuda: r.deuda != null ? Number(r.deuda) : null,
        ultimoMonto: montoMap.get(r.dni) ?? null,
        estado,
      };
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
