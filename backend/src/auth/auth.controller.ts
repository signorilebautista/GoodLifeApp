import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { IsEmail, IsString, MinLength } from 'class-validator';

class LoginDto {
  @IsEmail() mail: string;
  @IsString() password: string;
}

class ChangePasswordDto {
  @IsEmail() mail: string;
  @IsString() currentPassword: string;
  @IsString() @MinLength(6) newPassword: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    try {
      return await this.authService.login(dto.mail, dto.password);
    } catch {
      throw new HttpException('Credenciales incorrectas', HttpStatus.UNAUTHORIZED);
    }
  }

  @Post('change-password')
  async changePassword(@Body() dto: ChangePasswordDto) {
    try {
      await this.authService.changePassword(dto.mail, dto.currentPassword, dto.newPassword);
      return { ok: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      throw new HttpException(msg, HttpStatus.BAD_REQUEST);
    }
  }
}
