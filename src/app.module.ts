import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './redis/redis.module';
import { HttpModule } from '@nestjs/axios';
import { ConnectionModule } from './connection/connection.module';
import { WsModule } from './ws/ws.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,
    ConnectionModule,
    HttpModule.register({
      timeout: 5000,
    }),
    WsModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
