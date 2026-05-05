import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

import { USER_SERVICE_NAME, USER_V1_PACKAGE_NAME } from 'src/generated-types/user';
import { MailModule } from 'src/mail/mail.module';
import { EMAIL_QUEUE } from './email-queue.constants';
import { EmailProcessor } from './email.processor';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          db: configService.get<number>('REDIS_DB'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: EMAIL_QUEUE }),
    BullBoardModule.forFeature({ name: EMAIL_QUEUE, adapter: BullMQAdapter }),
    MailModule,
    ClientsModule.registerAsync([
      {
        name: USER_SERVICE_NAME,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: USER_V1_PACKAGE_NAME,
            protoPath: 'proto/user.proto',
            url: configService.getOrThrow<string>('USER_SERVICE_URL'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [EmailProcessor],
  exports: [BullModule],
})
export class EmailQueueModule {}
