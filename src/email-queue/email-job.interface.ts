export interface EmailJobPayload {
  userId?: string;
  to?: string;
  subject: string;
  html?: string;
  template?: string;
  context?: Record<string, unknown>;
}
