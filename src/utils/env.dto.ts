import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsInt, IsNotEmpty, IsNumber, IsString, IsUrl, Max, Min } from 'class-validator';

export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  readonly NODE_ENV: string;

  @IsNumber()
  @IsInt()
  readonly HTTP_PORT: number;

  @IsUrl({ protocols: ['amqp', 'amqps'], require_tld: false }, { message: 'RABBITMQ_URL must be a valid AMQP URL' })
  @IsNotEmpty()
  readonly RABBITMQ_URL: string;

  @IsString()
  @IsNotEmpty()
  readonly RABBITMQ_QUEUE: string;

  @IsString()
  @IsNotEmpty()
  readonly MAIL_HOST: string;

  @IsNumber()
  @IsInt()
  readonly MAIL_PORT: number;

  @IsString()
  @IsNotEmpty()
  readonly MAIL_USERNAME: string;

  @IsString()
  @IsNotEmpty()
  readonly MAIL_PASSWORD: string;

  @IsEmail()
  @IsNotEmpty()
  readonly MAIL_FROM: string;

  @IsString()
  @IsNotEmpty()
  readonly MAIL_FROM_NAME: string;

  @IsNotEmpty()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  readonly MAIL_SECURE: boolean;

  @IsString()
  @IsNotEmpty()
  readonly REDIS_HOST: string;

  @IsInt()
  @Min(0)
  @Max(65535)
  readonly REDIS_PORT: number;

  @IsInt()
  @Min(0)
  @Max(15)
  readonly REDIS_DB: number;

  @IsString()
  @IsNotEmpty()
  readonly USER_SERVICE_URL: string;
}
