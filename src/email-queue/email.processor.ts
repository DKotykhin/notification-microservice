import { Inject, Logger, OnModuleInit } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import type { ClientGrpc } from '@nestjs/microservices';
import { Job } from 'bullmq';
import { firstValueFrom } from 'rxjs';

import { USER_SERVICE_NAME, type User, type UserServiceClient } from 'src/generated-types/user';
import { MailService } from 'src/mail/mail.service';
import { EMAIL_JOB_SEND_CONFIRMATION, EMAIL_QUEUE } from './email-queue.constants';
import type { EmailJobPayload } from './email-job.interface';

@Processor(EMAIL_QUEUE)
export class EmailProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(EmailProcessor.name);
  private userServiceClient: UserServiceClient;

  constructor(
    @Inject(USER_SERVICE_NAME) private readonly userMicroserviceClient: ClientGrpc,
    private readonly mailService: MailService,
  ) {
    super();
  }

  onModuleInit() {
    this.userServiceClient = this.userMicroserviceClient.getService<UserServiceClient>(USER_SERVICE_NAME);
  }

  async process(job: Job<EmailJobPayload>): Promise<void> {
    if (job.name === EMAIL_JOB_SEND_CONFIRMATION) {
      const payload = job.data;
      this.logger.log(`Processing ${job.name} (attempt ${job.attemptsMade + 1})`);
      const toEmail = await this.resolveEmail(payload);
      await this.mailService.sendMail({
        to: toEmail,
        subject: payload.subject,
        template: payload.template,
        context: payload.context,
      });
      this.logger.log(`Order confirmation email sent to ${toEmail}`);
    }
  }

  private async resolveEmail(payload: EmailJobPayload): Promise<string> {
    if (payload.to) return payload.to;
    if (!payload.userId) throw new Error('Job payload must include either to or userId');
    const user: User = await firstValueFrom(this.userServiceClient.getUserById({ id: payload.userId }));
    return user.email;
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} (${job.name}) failed after ${job.attemptsMade} attempts: ${error.message}`);
  }
}
