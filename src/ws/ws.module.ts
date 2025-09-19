import { Module } from '@nestjs/common';
import { WsGateway } from './ws.gateway';
import { HttpModule } from '@nestjs/axios';
import { ConnectionModule } from '../connection/connection.module';
import { WsService } from './ws.service';

@Module({
  imports: [ConnectionModule, HttpModule],
  providers: [WsGateway, WsService],
})
export class WsModule {}
