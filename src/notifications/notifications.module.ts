import { Module } from '@nestjs/common';

import { RmqConsumerService } from 'src/rmq-consumer/rmq-consumer.service';
import { EmailQueueModule } from 'src/email-queue/email-queue.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [EmailQueueModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, RmqConsumerService],
})
export class NotificationsModule {}
