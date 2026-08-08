import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlantillaEjercicios } from './plantilla.entity';
import { CreatePlantillaDto, UpdatePlantillaDto } from './plantilla.dto';

@Injectable()
export class PlantillasService {
  constructor(
    @InjectRepository(PlantillaEjercicios) private plantillaRepo: Repository<PlantillaEjercicios>,
  ) {}

  findAll(): Promise<PlantillaEjercicios[]> {
    return this.plantillaRepo.find({ order: { nombre: 'ASC' } });
  }

  async findOne(id: number): Promise<PlantillaEjercicios> {
    const plantilla = await this.plantillaRepo.findOne({ where: { id } });
    if (!plantilla) throw new BadRequestException(`Plantilla ${id} no encontrada`);
    return plantilla;
  }

  create(dto: CreatePlantillaDto): Promise<PlantillaEjercicios> {
    const plantilla = this.plantillaRepo.create({
      nombre: dto.nombre.trim(),
      descripcion: dto.descripcion?.trim() || null,
      plan: dto.plan,
    });
    return this.plantillaRepo.save(plantilla);
  }

  async update(id: number, dto: UpdatePlantillaDto): Promise<PlantillaEjercicios> {
    const plantilla = await this.findOne(id);
    if (dto.nombre !== undefined) plantilla.nombre = dto.nombre.trim();
    if (dto.descripcion !== undefined) plantilla.descripcion = dto.descripcion.trim() || null;
    if (dto.plan !== undefined) plantilla.plan = dto.plan;
    return this.plantillaRepo.save(plantilla);
  }

  async remove(id: number): Promise<void> {
    await this.plantillaRepo.delete({ id });
  }
}
