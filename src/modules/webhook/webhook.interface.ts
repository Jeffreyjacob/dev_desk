import { WebhookDeliveryStatus } from "../../generated/prisma/enums";

export interface ICreateWebhookEndpointPayload {
  url: string;
  events: string[];
  description?: string;
}

export interface ICreateWebhookEndpointResponse {
  id: string;
  url: string;
  events: string[];
  description: string | null;
  isActive: boolean;
  secret: string;
  createdAt: Date;
}

export interface IWebhookEndpointResponse {
  id: string;
  url: string;
  events: string[];
  description: string | null;
  isActive: boolean;
  created: Date;
}

export interface IWebhookDeliveryResponse {
  id: string;
  event: string;
  status: WebhookDeliveryStatus;
  responseStatus: number | null;
  responseBody: string | null;
  attempt: number;
  deliveredAt: Date | null;
  createdAt: Date;
}

export interface IWebhookDeliveryJobData {
  endpointId: string;
  workspaceId: string;
  event: string;
  payload: Record<string, unknown>;
  deliveryId: string;
}
