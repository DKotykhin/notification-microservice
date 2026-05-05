import { Controller, Logger, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';

import { RmqService } from 'src/rmq/rmq.service';
import { NotificationsService } from './notifications.service';
import { RmqMetricsInterceptor } from 'src/supervision/metrics/interceptors';
import { EmailNotificationDto } from './dto/email-notification.dto';

@Controller()
@UseInterceptors(RmqMetricsInterceptor)
export class NotificationsController {
  protected readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly rmqService: RmqService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @EventPattern('notification.email.send')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async sendNotificationEmail(@Ctx() context: RmqContext, @Payload() payload: EmailNotificationDto) {
    const event = 'notification.email.send';
    this.logger.log(`Received email job for ${payload?.userId ?? payload?.to}, queuing...`);

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
