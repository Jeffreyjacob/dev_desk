import { prisma } from "../../config/database";
import {
  WebhookDelivery,
  WebhookDeliveryStatus,
  WebhookEndpoint,
  Prisma,
} from "../../generated/prisma/client";

export class WebhookRepository {
  async createEndpoint(data: {
    workspaceId: string;
    url: string;
    secret: string;
    events: string[];
    description?: string;
  }): Promise<WebhookEndpoint> {
    return prisma.webhookEndpoint.create({ data });
  }

  async findEndpointById(
    workspaceId: string,
    id: string
  ): Promise<WebhookEndpoint | null> {
    return prisma.webhookEndpoint.findFirst({
      where: { id, workspaceId },
    });
  }

  async findActiveEndpointsForevent(
    workspaceId: string,
    event: string
  ): Promise<WebhookEndpoint[]> {
    return prisma.webhookEndpoint.findMany({
      where: {
        workspaceId,
        isActive: true,
        events: { has: event },
      },
    });
  }

  async listEndpoints(workspaceId: string): Promise<WebhookEndpoint[]> {
    return prisma.webhookEndpoint.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
  }

  async deleteEndpoint(workspaceId: string, id: string): Promise<void> {
    await prisma.webhookEndpoint.delete({
      where: { id, workspaceId },
    });
  }

  async createDelivery(data: {
    endpointId: string;
    workspaceId: string;
    event: string;
    payload: Prisma.InputJsonValue;
  }): Promise<WebhookDelivery> {
    return prisma.webhookDelivery.create({
      data: {
        ...data,
        status: WebhookDeliveryStatus.PENDING,
        attempt: 1,
      },
    });
  }

  async markDeliverySuccess(
    id: string,
    responseStatus: number,
    responseBody: string
  ): Promise<void> {
    await prisma.webhookDelivery.update({
      where: { id },
      data: {
        status: WebhookDeliveryStatus.SUCCESS,
        responseStatus,
        responseBody: responseBody.slice(0, 1000),
        deliveredAt: new Date(),
      },
    });
  }

  async markDeliveryFailed(
    id: string,
    responseStatus: number | null,
    responseBody: string,
    attempt: number
  ): Promise<void> {
    await prisma.webhookDelivery.update({
      where: { id },
      data: {
        status: WebhookDeliveryStatus.FAILED,
        responseStatus,
        responseBody: responseBody.slice(0, 1000),
        attempt,
      },
    });
  }

  async listDeliveries(
    endpointId: string,
    workspaceId: string,
    params: { cursor?: string; limit: number }
  ) {
    const take = params.limit + 1;
    const cursor = params.cursor
      ? { id: Buffer.from(params.cursor, "base64url").toString() }
      : undefined;

    const items = await prisma.webhookDelivery.findMany({
      where: { endpointId, workspaceId },
      orderBy: { createdAt: "desc" },
      take,
      cursor,
      skip: cursor ? 1 : 0,
    });

    const hasMore = items.length > params.limit;
    const data = hasMore ? items.slice(0, params.limit) : items;
    const nextCursor =
      hasMore && data.length > 0
        ? Buffer.from(data[data.length - 1].id).toString("base64url")
        : null;

    return { data, meta: { hasMore, nextCursor } };
  }
}
