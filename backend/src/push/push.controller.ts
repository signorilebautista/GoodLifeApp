import { Body, Controller, Post } from '@nestjs/common';
import { PushService } from './push.service';
import { SubscribePushDto, UnsubscribePushDto } from './push.dto';

@Controller('push')
export class PushController {
  constructor(private readonly service: PushService) {}

  @Post('subscribe')
  subscribe(@Body() dto: SubscribePushDto) {
    return this.service.guardarSuscripcion(dto);
  }

  @Post('unsubscribe')
  unsubscribe(@Body() dto: UnsubscribePushDto) {
    return this.service.eliminarSuscripcion(dto.endpoint);
  }
}
