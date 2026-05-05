import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { EMAIL_JOB_SEND_CONFIRMATION, EMAIL_QUEUE } from 'src/email-queue/email-queue.constants';
import type { EmailJobPayload } from 'src/email-queue/email-job.interface';

@Injectable()
export class NotificationsService {
  protected readonly logger = new Logger(NotificationsService.name);

  constructor(@InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue) {}

  async enqueueEmail(payload: EmailJobPayload): Promise<void> {
    await this.emailQueue.add(EMAIL_JOB_SEND_CONFIRMATION, payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false,
    });
    this.logger.log(`Queued ${EMAIL_JOB_SEND_CONFIRMATION} job for user ${payload.userId}`);
  }
}
