import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';

import { MailService } from './mail.service';
import { TemplateService } from './template.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.getOrThrow<string>('MAIL_HOST'),
          port: configService.getOrThrow<number>('MAIL_PORT'),
          secure: configService.getOrThrow<string>('MAIL_SECURE') === 'true',
          auth: {
            user: configService.getOrThrow<string>('MAIL_USERNAME'),
            pass: configService.getOrThrow<string>('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: `"${configService.getOrThrow<string>('MAIL_FROM_NAME')}" <${configService.getOrThrow<string>('MAIL_FROM')}>`,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService, TemplateService],
  exports: [MailService],
})
export class MailModule {}
