import { Module } from '@nestjs/common';

import { HealthCheckController } from './health-check.controller';
import { RmqConsumerService } from 'src/rmq-consumer/rmq-consumer.service';

@Module({
  controllers: [HealthCheckController],
  providers: [RmqConsumerService],
})
export class HealthCheckModule {}
