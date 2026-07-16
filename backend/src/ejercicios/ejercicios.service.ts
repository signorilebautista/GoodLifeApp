import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ejercicio } from './ejercicio.entity';
import { ZonaMuscular } from './zona-muscular.entity';
import { CreateEjercicioDto, UpdateEjercicioDto } from './ejercicio.dto';

@Injectable()
export class EjerciciosService {
  constructor(
    @InjectRepository(Ejercicio) private ejercicioRepo: Repository<Ejercicio>,
    @InjectRepository(ZonaMuscular) private zonaRepo: Repository<ZonaMuscular>,
  ) {}

  findAll() {
    return this.ejercicioRepo.find({ relations: ['zona'] });
  }

  findZonas() {
    return this.zonaRepo.find({ order: { nombre: 'ASC' } });
  }

  async remove(id: number): Promise<void> {
    await this.ejercicioRepo.delete({ idEjercicio: id });
  }

  async update(id: number, dto: UpdateEjercicioDto): Promise<Ejercicio> {
    const ejercicio = await this.ejercicioRepo.findOne({ where: { idEjercicio: id }, relations: ['zona'] });
    if (!ejercicio) throw new BadRequestException(`Ejercicio ${id} no encontrado`);
    if (dto.nombre !== undefined) ejercicio.nombre = dto.nombre;
    if (dto.videoUrl !== undefined) ejercicio.videoUrl = dto.videoUrl;
    if (dto.idZona !== undefined) ejercicio.idZona = dto.idZona;
    return this.ejercicioRepo.save(ejercicio);
  }

  async create(dto: CreateEjercicioDto): Promise<Ejercicio> {
    if (!dto.nombre?.trim()) throw new BadRequestException('El nombre del ejercicio es obligatorio.');
    let idZona = dto.idZona ?? null;

    if (dto.nuevaZona?.trim()) {
      const existing = await this.zonaRepo.findOne({ where: { nombre: dto.nuevaZona.trim() } });
      if (existing) {
        idZona = existing.idZona;
      } else {
        const nueva = this.zonaRepo.create({ nombre: dto.nuevaZona.trim() });
        const saved = await this.zonaRepo.save(nueva);
        idZona = saved.idZona;
      }
    }

    const ejercicio = this.ejercicioRepo.create({
      nombre: dto.nombre,
      idZona,
      videoUrl: dto.videoUrl ?? null,
    });
    return this.ejercicioRepo.save(ejercicio);
  }
}
