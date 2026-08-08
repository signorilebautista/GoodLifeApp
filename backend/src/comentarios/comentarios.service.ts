import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comentario } from './comentario.entity';
import { CreateComentarioDto } from './comentario.dto';
import { Socio } from '../socios/socio.entity';

export interface ComentarioConSocio {
  id: number;
  dniSocio: string;
  texto: string;
  createdAt: Date;
  leido: boolean;
  leidoEn: Date | null;
  nombreSocio: string | null;
  apellidoSocio: string | null;
}

@Injectable()
export class ComentariosService {
  constructor(
    @InjectRepository(Comentario) private comentarioRepo: Repository<Comentario>,
  ) {}

  create(dto: CreateComentarioDto): Promise<Comentario> {
    const comentario = this.comentarioRepo.create({
      dniSocio: dto.dniSocio,
      texto: dto.texto.trim(),
    });
    return this.comentarioRepo.save(comentario);
  }

  async findAll(filters: { leido?: string; dniSocio?: string }): Promise<ComentarioConSocio[]> {
    const qb = this.comentarioRepo
      .createQueryBuilder('c')
      .leftJoin(Socio, 's', 's."DNI"::text = c."dniSocio"')
      .select('c.id', 'id')
      .addSelect('c."dniSocio"', 'dniSocio')
      .addSelect('c.texto', 'texto')
      .addSelect('c."createdAt"', 'createdAt')
      .addSelect('c.leido', 'leido')
      .addSelect('c."leidoEn"', 'leidoEn')
      .addSelect('s.nombre', 'nombreSocio')
      .addSelect('s.apellido', 'apellidoSocio')
      .orderBy('c."createdAt"', 'DESC');

    if (filters.dniSocio) qb.andWhere('c."dniSocio" = :dniSocio', { dniSocio: filters.dniSocio });
    if (filters.leido !== undefined) qb.andWhere('c.leido = :leido', { leido: filters.leido === 'true' });

    return qb.getRawMany<ComentarioConSocio>();
  }

  async marcarLeido(id: number): Promise<Comentario> {
    const comentario = await this.comentarioRepo.findOne({ where: { id } });
    if (!comentario) throw new BadRequestException(`Comentario ${id} no encontrado`);
    comentario.leido = true;
    comentario.leidoEn = new Date();
    return this.comentarioRepo.save(comentario);
  }
}
