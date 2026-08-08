import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushSubscription } from './push-subscription.entity';
import { PushNotificacionEnviada } from './push-notificacion-enviada.entity';
import { PushService } from './push.service';
import { PushController } from './push.controller';
import { SociosModule } from '../socios/socios.module';

@Module({
  imports: [TypeOrmModule.forFeature([PushSubscription, PushNotificacionEnviada]), SociosModule],
  controllers: [PushController],
  providers: [PushService],
})
export class PushModule {}
