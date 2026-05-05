import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

import { TemplateService } from './template.service';
import { EmailJobPayload } from 'src/email-queue/email-job.interface';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly templateService: TemplateService,
  ) {}

  async sendMail(emailRequest: EmailJobPayload) {
    const htmlContent = emailRequest.template
      ? await this.templateService.getTemplate(emailRequest.template, emailRequest.context || {})
      : emailRequest.html;

    if (!htmlContent) {
      throw new Error('Either html content or a template must be provided.');
    }
    await this.mailerService.sendMail({
      to: emailRequest.to,
      subject: emailRequest.subject,
      html: htmlContent,
      context: emailRequest.context,
    });
  }
}
