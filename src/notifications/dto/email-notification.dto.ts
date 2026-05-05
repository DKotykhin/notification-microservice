import { IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class EmailNotificationDto {
  @ValidateIf((o: EmailNotificationDto) => !o.to)
  @IsString()
  @IsNotEmpty()
  userId?: string;

  @ValidateIf((o: EmailNotificationDto) => !o.userId)
  @IsString()
  @IsNotEmpty()
  to?: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @ValidateIf((o: EmailNotificationDto) => !o.template)
  @IsString()
  @IsNotEmpty()
  html?: string;

  @ValidateIf((o: EmailNotificationDto) => !o.html)
  @IsString()
  @IsNotEmpty()
  template?: string;

  @IsOptional()
  context?: Record<string, unknown>;
}
