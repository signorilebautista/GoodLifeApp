import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: Number(config.get('SMTP_PORT', 587)),
      secure: false,
      auth: {
        user: config.get<string>('SMTP_USER'),
        pass: config.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendWelcome(to: string, nombre: string, tempPassword: string): Promise<void> {
    const from = this.config.get<string>('SMTP_USER');
    try {
      await this.transporter.sendMail({
        from: `"Good Life Center" <${from}>`,
        to,
        subject: 'Bienvenido a Good Life Center',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
            <div style="background: #1976D2; padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 22px;">GOOD LIFE CENTER</h1>
            </div>
            <div style="padding: 32px; background: #f9f9f9;">
              <h2 style="color: #111827;">¡Hola, ${nombre}!</h2>
              <p style="color: #374151;">Tu cuenta fue creada exitosamente. Podés ingresar al sistema con las siguientes credenciales:</p>
              <div style="background: white; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 0 0 8px;"><strong>Usuario:</strong> ${to}</p>
                <p style="margin: 0;"><strong>Contraseña temporal:</strong> <span style="font-size: 18px; letter-spacing: 2px; color: #1976D2;">${tempPassword}</span></p>
              </div>
              <p style="color: #6B7280; font-size: 13px;">Por seguridad, te recomendamos cambiar tu contraseña al ingresar por primera vez.</p>
            </div>
          </div>
        `,
      });
      this.logger.log(`Welcome email sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err.message}`);
      throw err;
    }
  }
}
