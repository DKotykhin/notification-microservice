import { Injectable, Logger } from '@nestjs/common';
import { RmqContext } from '@nestjs/microservices';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Channel, ConsumeMessage } from 'amqplib';
import { Counter } from 'prom-client';

@Injectable()
export class RmqConsumerService {
  private readonly SERVICE_NAME: string;

  constructor(
    @InjectMetric('rmq_events_success_total') private readonly rmqEventsSuccessTotal: Counter<string>,
    @InjectMetric('rmq_events_failed_total') private readonly rmqEventsFailedTotal: Counter<string>,
  ) {
    this.SERVICE_NAME = 'notification-microservice';
  }
  private readonly logger = new Logger(RmqConsumerService.name);

  ackMessage(context: RmqContext, event?: string) {
    const channel = context.getChannelRef() as Channel;
    const originalMessage = context.getMessage() as ConsumeMessage;
    const tag = originalMessage?.fields.deliveryTag;
    if (!tag) {
      this.logger.error('Delivery tag is missing in the original message fields');
      return;
    }
    channel.ack(originalMessage);
    this.logger.log(`Message with content ${originalMessage.content.toString()} acknowledged for event ${event}`);
    this.rmqEventsSuccessTotal.inc({ service: this.SERVICE_NAME, event: event || 'unknown' });
  }

  nackMessage(context: RmqContext, event?: string, requeue = false) {
    const channel = context.getChannelRef() as Channel;
    const originalMessage = context.getMessage() as ConsumeMessage;
    const tag = originalMessage?.fields.deliveryTag;
    if (!tag) {
      this.logger.error('Delivery tag is missing in the original message fields');
      return;
    }
    channel.nack(originalMessage, false, requeue);
    this.rmqEventsFailedTotal.inc({ service: this.SERVICE_NAME, event: event || 'unknown' });
    if (requeue) {
      this.logger.warn(`Message with content ${originalMessage.content.toString()} not acknowledged and requeued`);
    } else {
      this.logger.warn(`Message with content ${originalMessage.content.toString()} not acknowledged and discarded`);
    }
  }
}
