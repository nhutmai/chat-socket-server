/* eslint-disable
@typescript-eslint/no-unsafe-member-access,
@typescript-eslint/no-unsafe-assignment
*/
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { redisHost, redisPort, webPort, redisPassword } from './utils/constant';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await app.listen(webPort);
  console.log(`🚀 HTTP and WebSocket server running on: ${await app.getUrl()}`);

  const microservice =
    await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
      transport: Transport.REDIS,
      options: {
        host: redisHost,
        port: redisPort,
        password: redisPassword,
      },
    });
  await microservice.listen();
}
bootstrap();
