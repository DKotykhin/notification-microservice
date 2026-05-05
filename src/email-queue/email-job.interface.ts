export interface EmailJobPayload {
  userId?: string;
  to?: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;
}
