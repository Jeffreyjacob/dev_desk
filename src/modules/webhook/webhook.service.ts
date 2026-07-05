import { logger } from "../../config/logger";
import { Prisma } from "../../generated/prisma/client";
import { getWebhookQueue } from "../../job/queues/webhook";
import { ForbiddenError, NotFoundError } from "../../shared/errors";
import { WorkspaceRepository } from "../workspace/workspace.repository";
import { WebhookRepository } from "./webhook.repository";
import { CreateWebhookEndpointInput } from "./webhook.validation";
import crypto from "crypto";

export class WebhookService {
  constructor(
    private readonly webhookRepo: WebhookRepository,
    private readonly workspaceRepo: WorkspaceRepository
  ) {}

  async createEndpoint(workspaceId: string, data: CreateWebhookEndpointInput) {
    const workspace = await this.workspaceRepo.findById(workspaceId);
    if (!workspace) throw new NotFoundError("workspace not found");

    if (!workspace.webhooksEnabled) {
      throw new ForbiddenError("Outbound webhooks require A PRO subscription");
    }

    const secret = crypto.randomBytes(32).toString("hex");

    const endpoint = await this.webhookRepo.createEndpoint({
      workspaceId,
      url: data.url,
      secret,
      events: data.events,
      description: data.description,
    });

    return {
      id: endpoint.id,
      url: endpoint.url,
      events: endpoint.events,
      description: endpoint.descriptoon,
      isActive: endpoint.isActive,
      secret,
      createdAt: endpoint.createdAt,
    };
  }

  async listEndpoints(workspaceId: string) {
    const endpoints = await this.webhookRepo.listEndpoints(workspaceId);

    return endpoints.map((e) => ({
      id: e.id,
      url: e.url,
      events: e.events,
      description: e.descriptoon,
      isActive: e.isActive,
      createdAt: e.createdAt,
    }));
  }

  async deleteEndpoint(workspaceId: string, endpointId: string) {
    const endpoint = await this.webhookRepo.findEndpointById(
      workspaceId,
      endpointId
    );
    if (!endpoint) throw new NotFoundError("Webhook not found");
    await this.webhookRepo.deleteEndpoint(workspaceId, endpointId);
  }

  async listDeliveries(
    workspaceId: string,
    endpointId: string,
    params: { cursor?: string; limit: number }
  ) {
    const endpoint = await this.webhookRepo.findEndpointById(
      workspaceId,
      endpointId
    );

    if (!endpoint) throw new NotFoundError("Webhook endpoint not found");

    return this.webhookRepo.listDeliveries(endpointId, workspaceId, params);
  }

  async sendTestPing(workspaceId: string, endpointId: string) {
    const endpoint = await this.webhookRepo.findEndpointById(
      workspaceId,
      endpointId
    );

    if (!endpoint) throw new NotFoundError("Webhook endpoint not found");

    const testPayload = {
      event: "ping",
      workspaceId,
      data: { message: "This is a test ping from DevDesk" },
      timestamp: new Date().toISOString(),
    };

    const delivery = await this.webhookRepo.createDelivery({
      endpointId: endpoint.id,
      workspaceId,
      event: "ping",
      payload: testPayload,
    });

    const queue = getWebhookQueue();
    await queue.add("deliver-webhook", {
      endpointId: endpoint.id,
      workspaceId,
      event: "ping",
      payload: testPayload,
      deliveryId: delivery.id,
    });

    return { message: "Test ping queue" };
  }

  async dispatchEvent(
    workspaceId: string,
    event: string,
    data: Record<string, unknown>
  ): Promise<void> {
    const workspace = await this.workspaceRepo.findById(workspaceId);

    if (!workspace?.webhooksEnabled) return;

    const endpoints = await this.webhookRepo.findActiveEndpointsForevent(
      workspaceId,
      event
    );

    if (endpoints.length === 0) return;

    const payload = {
      event,
      workspaceId,
      data,
      timestamp: new Date().toISOString(),
    };

    const queue = getWebhookQueue();

    for (const endpoint of endpoints) {
      try {
        const delivery = await this.webhookRepo.createDelivery({
          endpointId: endpoint.id,
          workspaceId,
          event,
          payload: payload as Prisma.InputJsonValue,
        });

        await queue.add(
          "delivery-webhook",
          {
            endpointId: endpoint.id,
            workspaceId,
            event,
            payload,
            deliveryId: delivery.id,
          },
          {
            attempts: 5,
            backoff: {
              type: "exponential",
              delay: 1000,
            },
          }
        );
      } catch (error: any) {
        logger.error(
          {
            error,
            endpointId: endpoint.id,
            event,
          },
          "Failed to queue webhook delivery"
        );
      }
    }
  }
}
