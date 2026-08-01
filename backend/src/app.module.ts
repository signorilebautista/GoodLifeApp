import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SociosModule } from './socios/socios.module';
import { TurneroModule } from './turnero/turnero.module';
import { StatsModule } from './stats/stats.module';
import { AuthModule } from './auth/auth.module';
import { EjerciciosModule } from './ejercicios/ejercicios.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        const isDev = config.get<string>('NODE_ENV') !== 'production';
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            ssl: { rejectUnauthorized: false },
            autoLoadEntities: true,
            synchronize: isDev,
          };
        }
        return {
          type: 'postgres',
          host: config.get<string>('DB_HOST', 'localhost'),
          port: Number(config.get('DB_PORT', 5432)),
          username: config.get<string>('DB_USER', 'postgres'),
          password: config.get<string>('DB_PASSWORD', 'postgres'),
          database: config.get<string>('DB_NAME', 'goodlife'),
          autoLoadEntities: true,
          synchronize: isDev,
        };
      },
    }),
    SociosModule,
    TurneroModule,
    StatsModule,
    AuthModule,
    EjerciciosModule,
  ],
})
export class AppModule {}
