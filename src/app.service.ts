import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis/redis.provider';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {}

  //Đảm bảo Redis client đã kết nối trước khi sử dụng
  async onModuleInit() {
    console.log('AppService is initialized. Redis client should be connected.');
    const pong = await this.redisClient.ping();
    console.log(`Redis PING -> ${pong}`); // In ra "PONG" nếu thành công
  }

  getHello(): string {
    return 'Hello World!';
  }
}
