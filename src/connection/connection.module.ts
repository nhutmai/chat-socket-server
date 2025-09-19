import { Module } from '@nestjs/common';
import { ConnectionService } from './connection.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [ConnectionService],
  exports: [ConnectionService],
})
export class ConnectionModule {}
