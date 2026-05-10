import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';

import { validateEnv } from './utils/validators/env-validator';
import { EnvironmentVariables } from './utils/env.dto';
import { HealthCheckModule } from './health-check/health-check.module';
import { RmqConsumerModule } from './rmq-consumer/rmq-consumer.module';
import { MailModule } from './mail/mail.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MetricsModule } from './supervision/metrics/metrics.module';
import { EmailQueueModule } from './email-queue/email-queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local'],
      validate: (config) => validateEnv(config, EnvironmentVariables),
    }),
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter,
    }),
    HealthCheckModule,
    RmqConsumerModule,
    MailModule,
    NotificationsModule,
    MetricsModule,
    EmailQueueModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
