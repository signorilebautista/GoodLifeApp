import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import * as webpush from 'web-push';
import { PushSubscription } from './push-subscription.entity';
import { PushNotificacionEnviada } from './push-notificacion-enviada.entity';
import { SociosService } from '../socios/socios.service';
import { SubscribePushDto } from './push.dto';

interface PushPayload {
  title: string;
  body: string;
}

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private vapidConfigured = false;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(PushSubscription) private subscriptionRepo: Repository<PushSubscription>,
    @InjectRepository(PushNotificacionEnviada) private envioRepo: Repository<PushNotificacionEnviada>,
    private readonly sociosService: SociosService,
  ) {}

  onModuleInit() {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.config.get<string>('VAPID_SUBJECT');
    if (!publicKey || !privateKey || !subject) {
      this.logger.warn('VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY/VAPID_SUBJECT no configuradas: las notificaciones push están deshabilitadas.');
      return;
    }
    webpush.setVapidDetails(subject, publicKey, privateKey);
    this.vapidConfigured = true;
  }

  async guardarSuscripcion(dto: SubscribePushDto): Promise<{ ok: true }> {
    const existente = await this.subscriptionRepo.findOne({ where: { endpoint: dto.subscription.endpoint } });
    if (existente) {
      existente.dniSocio = dto.dniSocio;
      existente.p256dh = dto.subscription.keys.p256dh;
      existente.auth = dto.subscription.keys.auth;
      await this.subscriptionRepo.save(existente);
    } else {
      await this.subscriptionRepo.save(
        this.subscriptionRepo.create({
          dniSocio: dto.dniSocio,
          endpoint: dto.subscription.endpoint,
          p256dh: dto.subscription.keys.p256dh,
          auth: dto.subscription.keys.auth,
        }),
      );
    }
    return { ok: true };
  }

  async eliminarSuscripcion(endpoint: string): Promise<{ ok: true }> {
    await this.subscriptionRepo.delete({ endpoint });
    return { ok: true };
  }

  async enviarNotificacion(dniSocio: string, payload: PushPayload): Promise<void> {
    if (!this.vapidConfigured) return;
    const subs = await this.subscriptionRepo.find({ where: { dniSocio } });
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await this.subscriptionRepo.delete({ id: sub.id });
        } else {
          this.logger.error(`No se pudo enviar push a ${dniSocio}: ${err instanceof Error ? err.message : err}`);
        }
      }
    }
  }

  // Recorre los socios con vencimiento próximo (≤7 días) o vencido y les manda un push,
  // una vez por día por socio+estado (PushNotificacionEnviada dedupea si el cron corre
  // más de una vez el mismo día). Se avisa todos los días mientras dure la ventana, no
  // solo al entrar en ella, para que sea más difícil perderse el aviso.
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async notificarVencimientos(): Promise<void> {
    if (!this.vapidConfigured) return;
    const hoy = new Date().toISOString().slice(0, 10);
    const vencimientos = await this.sociosService.getVencimientos();

    for (const s of vencimientos) {
      if (s.estado !== 'proximo' && s.estado !== 'vencido') continue;
      const tipo = s.estado;
      const yaEnviado = await this.envioRepo.findOne({ where: { dniSocio: s.dni, tipo, fechaEnvio: hoy } });
      if (yaEnviado) continue;

      await this.enviarNotificacion(s.dni, {
        title: tipo === 'vencido' ? 'Tu cuota venció' : 'Tu cuota está por vencer',
        body: tipo === 'vencido'
          ? 'Regularizá tu pago para seguir entrenando.'
          : 'Tu cuota vence en los próximos días.',
      });

      await this.envioRepo.save(this.envioRepo.create({ dniSocio: s.dni, tipo, fechaEnvio: hoy }));
    }
  }
}
