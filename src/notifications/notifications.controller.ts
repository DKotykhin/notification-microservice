import { Controller, Logger, UseInterceptors } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';

import { RmqService } from 'src/rmq/rmq.service';
import { NotificationsService } from './notifications.service';
import type { EmailJobPayload } from 'src/email-queue/email-job.interface';
import { RmqMetricsInterceptor } from 'src/supervision/metrics/interceptors';

@Controller()
@UseInterceptors(RmqMetricsInterceptor)
export class NotificationsController {
  protected readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly rmqService: RmqService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @EventPattern('notification.email.send')
  async sendNotificationEmail(@Ctx() context: RmqContext, @Payload() payload: EmailJobPayload) {
    const event = 'notification.email.send';
    this.logger.log(`Received email job for user ${payload?.userId}, queuing...`);

    try {
      await this.notificationsService.enqueueEmail(payload);
      this.rmqService.ackMessage(context, event);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to enqueue email job for user ${payload?.userId}: ${errorMessage}`);
      this.rmqService.nackMessage(context, event, false);
      throw error;
    }
  }
}
