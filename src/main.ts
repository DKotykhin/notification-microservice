import { initTracing } from './supervision/tracing/tracing';

// Initialize tracing BEFORE any other imports to ensure proper instrumentation
initTracing();

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production' ? ['error'] : ['log', 'debug', 'warn', 'error', 'verbose'],
  });

  const logger = new Logger('Main');

  const configService = app.get(ConfigService);
  const url = configService.getOrThrow<string>('RABBITMQ_URL');
  const queue = configService.getOrThrow<string>('RABBITMQ_QUEUE');
  const PORT = configService.getOrThrow<number>('HTTP_PORT');

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [url],
      queue,
      queueOptions: {
        durable: true,
      },
      noAck: false,
      prefetchCount: 1,
      persistent: true,
    },
  });

  await app.startAllMicroservices();
  await app.listen(PORT);
  logger.log('Notification microservice is running on ' + url);
  logger.log('HTTP server is running on port ' + PORT);
}
void bootstrap();
