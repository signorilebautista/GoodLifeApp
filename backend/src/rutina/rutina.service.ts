import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistroPeso } from './registro-peso.entity';

@Injectable()
export class RutinaService {
  constructor(
    @InjectRepository(RegistroPeso)
    private readonly repo: Repository<RegistroPeso>,
  ) {}

  async guardarPeso(usuarioId: string, ejercicioId: number, peso: number): Promise<RegistroPeso> {
    const registro = this.repo.create({ usuarioId, ejercicioId, peso });
    return this.repo.save(registro);
  }

  async getHistorial(usuarioId: string, ejercicioId: number): Promise<RegistroPeso[]> {
    return this.repo.find({
      where: { usuarioId, ejercicioId },
      order: { fecha: 'ASC', id: 'ASC' },
    });
  }

  async getPesoActual(usuarioId: string, ejercicioId: number): Promise<number | null> {
    const registro = await this.repo.findOne({
      where: { usuarioId, ejercicioId },
      order: { fecha: 'DESC', id: 'DESC' },
    });
    return registro ? Number(registro.peso) : null;
  }

  async getPesosActuales(usuarioId: string): Promise<Record<number, number>> {
    const rows: { ejercicioId: number; peso: string }[] = await this.repo.manager.query(
      `SELECT DISTINCT ON ("ejercicioId") "ejercicioId", peso
       FROM "RegistrosPeso"
       WHERE "usuarioId" = $1
       ORDER BY "ejercicioId", fecha DESC, id DESC`,
      [usuarioId],
    );
    return Object.fromEntries(rows.map((r) => [r.ejercicioId, Number(r.peso)]));
  }
}
