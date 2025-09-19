import { Provider } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: () => {
    //create redis client
    const redisClient = new Redis({
      host: process.env.REDIS_HOST || '',
      port: parseInt(process.env.REDIS_PORT || ''),
      password: process.env.REDIS_PASSWORD || '',
    });

    //error event
    redisClient.on('error', (err) => {
      console.error('Redis Error:', err);
    });
    //connect event
    redisClient.on('connect', () => {
      console.log('✅ Connected to Redis successfully!');
    });

    return redisClient;
  },
};
