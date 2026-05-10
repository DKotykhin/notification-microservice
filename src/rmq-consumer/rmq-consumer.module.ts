import { Global, Module } from '@nestjs/common';
import { RmqConsumerService } from './rmq-consumer.service';

@Global()
@Module({
  controllers: [],
  providers: [RmqConsumerService],
})
export class RmqConsumerModule {}
