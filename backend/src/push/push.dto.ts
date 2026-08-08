import { IsNotEmpty, IsObject, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PushSubscriptionKeysDto {
  @IsString() @IsNotEmpty() p256dh: string;
  @IsString() @IsNotEmpty() auth: string;
}

class PushSubscriptionJsonDto {
  @IsString() @IsNotEmpty() endpoint: string;

  @IsObject()
  @ValidateNested()
  @Type(() => PushSubscriptionKeysDto)
  keys: PushSubscriptionKeysDto;
}

export class SubscribePushDto {
  @IsString() @IsNotEmpty() dniSocio: string;

  @IsObject()
  @ValidateNested()
  @Type(() => PushSubscriptionJsonDto)
  subscription: PushSubscriptionJsonDto;
}

export class UnsubscribePushDto {
  @IsString() @IsNotEmpty() endpoint: string;
}
