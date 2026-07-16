import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import { Usuario } from './usuario.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  hashPassword(password: string, salt: string): string {
    return createHash('sha256').update(salt + password).digest('hex');
  }

  generateSalt(): string {
    return randomBytes(16).toString('hex');
  }

  generateTempPassword(): string {
    return randomBytes(5).toString('hex').toUpperCase();
  }

  async createUsuario(mail: string, nombre: string, profesorDni: string, plainPassword: string): Promise<void> {
    const existing = await this.usuarioRepository.findOne({ where: { mail } });
    if (existing) {
      if (!existing.mustChangePassword) return; // ya configuró contraseña, no tocar
      // reenvío: regenerar contraseña y actualizar
      existing.salt = this.generateSalt();
      existing.passwordHash = this.hashPassword(plainPassword, existing.salt);
      await this.usuarioRepository.save(existing);
      return;
    }
    const salt = this.generateSalt();
    const passwordHash = this.hashPassword(plainPassword, salt);
    const usuario = this.usuarioRepository.create({
      mail,
      nombre,
      profesorDni,
      salt,
      passwordHash,
      role: 'profesor',
      mustChangePassword: true,
    });
    await this.usuarioRepository.save(usuario);
  }

  async login(mail: string, password: string): Promise<{ role: string; nombre: string; mail: string; mustChangePassword: boolean }> {
    const usuario = await this.usuarioRepository.findOne({ where: { mail } });
    if (!usuario) throw new UnauthorizedException('Credenciales incorrectas');
    const hash = this.hashPassword(password, usuario.salt);
    if (hash !== usuario.passwordHash) throw new UnauthorizedException('Credenciales incorrectas');
    return {
      role: usuario.role,
      nombre: usuario.nombre,
      mail: usuario.mail,
      mustChangePassword: usuario.mustChangePassword,
    };
  }

  async deleteByMail(mail: string): Promise<void> {
    await this.usuarioRepository.delete({ mail });
  }

  async changePassword(mail: string, currentPassword: string, newPassword: string): Promise<void> {
    const usuario = await this.usuarioRepository.findOne({ where: { mail } });
    if (!usuario) throw new UnauthorizedException('Usuario no encontrado');
    const hash = this.hashPassword(currentPassword, usuario.salt);
    if (hash !== usuario.passwordHash) throw new UnauthorizedException('Contraseña actual incorrecta');
    const newSalt = this.generateSalt();
    usuario.salt = newSalt;
    usuario.passwordHash = this.hashPassword(newPassword, newSalt);
    usuario.mustChangePassword = false;
    await this.usuarioRepository.save(usuario);
  }
}
