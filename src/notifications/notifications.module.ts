import { Module } from '@nestjs/common';

import { RmqService } from 'src/rmq/rmq.service';
import { EmailQueueModule } from 'src/email-queue/email-queue.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [EmailQueueModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, RmqService],
})
export class NotificationsModule {}
