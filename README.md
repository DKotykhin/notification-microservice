# Notification Microservice

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=flat&logo=rabbitmq&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)
![BullMQ](https://img.shields.io/badge/BullMQ-FF4444?style=flat)
![Nodemailer](https://img.shields.io/badge/Nodemailer-0F9DCE?style=flat&logo=minutemailer&logoColor=white)
![Handlebars](https://img.shields.io/badge/Handlebars-000000?style=flat&logo=handlebarsdotjs&logoColor=white)
![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=flat&logo=prometheus&logoColor=white)
![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-7B61FF?style=flat&logo=opentelemetry&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=flat&logo=jest&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=flat&logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=flat&logo=prettier&logoColor=black)

A NestJS-based microservice responsible for handling email notifications. Consumes events from RabbitMQ, enqueues jobs via BullMQ for reliable processing with retry logic, resolves recipient emails via the user-microservice (gRPC), and sends transactional emails using Nodemailer and Handlebars templates.

## Features

- **Reliable email delivery** — RabbitMQ events are ACKed immediately after the job is persisted in Redis; actual sending happens in a BullMQ worker with 3 attempts and exponential backoff
- **Dead-letter visibility** — failed jobs after max retries remain in Redis for manual inspection and replay
- **Flexible recipient resolution** — payloads may include a resolved `to` address (legacy) or a `userId` that is looked up via gRPC at processing time
- **Template engine** — Handlebars-based email templating with in-memory template cache
- **Observability** — OpenTelemetry tracing with Jaeger, Prometheus metrics for RabbitMQ events
- **Health checks** — liveness and readiness endpoints

## Architecture

```
Other Services
    │
    │  RabbitMQ event: { userId, subject, template, context }
    ▼
NotificationsController
    │  ACK RabbitMQ immediately (job is now safely in Redis)
    ▼
BullMQ Queue (Redis)
    │  3 attempts, exponential backoff (5 s → 25 s → 125 s)
    ▼
EmailProcessor (worker)
    ├── if payload.to present → use directly
    └── if payload.userId present → gRPC → UserService → resolve email
    │
    ▼
MailService → SMTP Server
```

## Tech Stack

- **Framework**: NestJS 11
- **Message Queue**: RabbitMQ (AMQP) — inbound event transport
- **Job Queue**: BullMQ + Redis — reliable async processing with retries
- **Email**: Nodemailer with @nestjs-modules/mailer
- **Templates**: Handlebars
- **Tracing**: OpenTelemetry + Jaeger
- **Metrics**: Prometheus (prom-client)
- **Runtime**: Node.js 24

## Project Structure

```
src/
├── main.ts                          # Application entry point
├── app.module.ts                    # Root module
├── health-check/                    # Health check endpoint
├── email-queue/
│   ├── email-queue.module.ts        # BullMQ root config + queue registration + gRPC client
│   ├── email-queue.constants.ts     # Queue name and job name constants
│   ├── email-job.interface.ts       # EmailJobPayload type
│   └── email.processor.ts           # BullMQ worker — resolves email and sends via MailService
├── mail/
│   ├── mail.module.ts               # Mailer module configuration
│   ├── mail.service.ts              # Email sending logic
│   ├── template.service.ts          # Handlebars template rendering
│   ├── email.request.interface.ts   # EmailRequest type (MailService input)
│   └── templates/                   # Email templates (.hbs files)
├── notifications/
│   ├── notifications.module.ts
│   ├── notifications.controller.ts  # Consumes RabbitMQ events, enqueues BullMQ jobs
│   └── notifications.service.ts     # Calls emailQueue.add()
├── rmq/
│   ├── rmq.module.ts
│   └── rmq.service.ts               # RabbitMQ ack/nack handling
├── supervision/
│   ├── metrics/                     # Prometheus metrics
│   └── tracing/                     # OpenTelemetry configuration
└── utils/
    ├── env.dto.ts                   # Environment validation
    ├── errors/                      # Error handling utilities
    └── validators/                  # Environment validators
```

## Event Patterns

| Pattern | Payload | Description |
|---------|---------|-------------|
| `notification.email.send` | `EmailJobPayload` | Enqueue an email job for async delivery |

## Email Job Payload

```typescript
interface EmailJobPayload {
  userId?: string;              // Resolved via gRPC to get recipient address
  to?: string;                  // Recipient address (used directly if present)
  subject: string;
  template: string;             // Template name (without .hbs extension)
  context: Record<string, unknown>;  // Template variables
}
```

One of `userId` or `to` must be provided. `userId` triggers a gRPC call to the user-microservice at processing time; `to` is used directly and skips the lookup.

## Available Templates

- **order-confirmation** — sent after a successful order; context: `{ orderId, items, total, currency, createdAt }`
- **abandoned-cart** — sent as a series of three reminders; context: `{ items, total, cartExpiresInDays }`
- **verify-email** — email verification; context: `{ name, verificationLink }`
- **reset-password** — password reset; context: `{ name, resetLink }`
- **reset-password-confirmation** — password reset confirmation
- **new-login** — new login alert; context: `{ name, location, device, time }`
- **account-locked** — account locked notification
- **account-banned** — account banned notification
- **account-unbanned** — account unbanned notification

## Inter-service Communication

| Dependency | Transport | Purpose |
|---|---|---|
| `user-microservice` | gRPC | Resolve recipient email address from `userId` |

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development`, `production` |
| `HTTP_PORT` | HTTP server port | `3000` |
| `RABBITMQ_URL` | RabbitMQ connection URL | `amqp://user:pass@localhost:5672` |
| `RABBITMQ_QUEUE` | Queue name to consume | `notification_queue` |
| `REDIS_HOST` | Redis hostname | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_DB` | Redis database index (0–15) | `0` |
| `USER_SERVICE_URL` | gRPC address of the user-microservice | `0.0.0.0:5001` |
| `MAIL_HOST` | SMTP server host | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP server port | `587` |
| `MAIL_USERNAME` | SMTP username | `user@example.com` |
| `MAIL_PASSWORD` | SMTP password | `password` |
| `MAIL_FROM` | Default sender email | `noreply@example.com` |
| `MAIL_FROM_NAME` | Default sender name | `CoffeeDoor` |
| `MAIL_SECURE` | Use TLS | `true`, `false` |

Copy `.env.example` to `.env.local` and fill in values before running locally.

## Installation

```bash
npm install
```

## Running the Service

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

## Docker

```bash
# Build the image
docker build -t notification-microservice .

# Run the container
docker run -p 3000:3000 --env-file .env.local notification-microservice
```

## Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## Observability

### Metrics

Prometheus metrics are exposed at the `/metrics` endpoint:
- `rmq_events_success_total` — counter for successfully enqueued RabbitMQ events
- `rmq_events_failed_total` — counter for failed RabbitMQ events
- Default Node.js metrics (memory, CPU, event loop, etc.)

### Tracing

OpenTelemetry traces are exported to Jaeger via gRPC on `http://jaeger:4317`. Instrumentation includes HTTP requests, NestJS core operations, and gRPC calls.

## Linting & Formatting

```bash
npm run lint
npm run format
```

## License

UNLICENSED - Private
