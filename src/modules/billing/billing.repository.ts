import Stripe from "stripe";
import { prisma } from "../../config/database";
import {
  StripeWebhookEvent,
  Subscription,
  SubscriptionStatus,
  WebhookEventStatus,
  WorkspacePlan,
} from "../../generated/prisma/client";
import { SubscriptionUpdateInput } from "../../generated/prisma/models";
import {
  BaseRepository,
  OffsetPaginationMeta,
} from "../../shared/repository/baseRepository";

export class BillingRepository {
  async findByWorkspaceId(workspaceId: string): Promise<Subscription | null> {
    return prisma.subscription.findUnique({ where: { workspaceId } });
  }

  async findByStripeSubscriptionId(
    stripeSubscriptionId: string
  ): Promise<Subscription | null> {
    return prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
    });
  }

  async createSubscription(data: {
    workspaceId: string;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    plan: WorkspacePlan;
    status: SubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }) {
    return prisma.subscription.create({
      data: {
        workspaceId: data.workspaceId,
        stripeCustomerId: data.stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        plan: data.plan,
        status: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        cancelAtPeriodEnd: false,
      },
    });
  }

  async syncFromStripe(
    stripeSubId: string,
    data: Partial<{
      status: SubscriptionStatus;
      currentPeriodStart: Date;
      currentPeriodEnd: Date;
      cancelAtPeriodEnd: boolean;
      plan: WorkspacePlan;
    }>
  ): Promise<Subscription> {
    return prisma.subscription.update({
      where: { stripeSubscriptionId: stripeSubId },
      data,
    });
  }

  async createBillingHistory(data: {
    workspaceId: string;
    subscriptionId: string;
    stripeInvoiceId: string;
    amount: number;
    currency: string;
    invoiceUrl?: string;
  }) {
    return prisma.billingHistory.create({ data });
  }

  async findWebhookEventById(stripeEventId: string) {
    return prisma.stripeWebhookEvent.findUnique({
      where: { stripeEventId: stripeEventId },
    });
  }

  async createWehbookEvent(event: Stripe.Event) {
    return prisma.stripeWebhookEvent.create({
      data: {
        eventType: event.type,
        stripeEventId: event.id,
        status: WebhookEventStatus.PROCESSING,
        payload: event as any,
      },
    });
  }

  async markWebhookProcessed(id: string) {
    return prisma.stripeWebhookEvent.update({
      where: {
        id,
      },
      data: {
        status: WebhookEventStatus.PROCESSED,
        processedAt: new Date(),
      },
    });
  }

  async markWebhookFailed(id: string, error: string) {
    return prisma.stripeWebhookEvent.update({
      where: {
        id,
      },
      data: {
        status: WebhookEventStatus.FAILED,
        error,
      },
    });
  }

  async incrementWebhookAttempts(id: string) {
    return prisma.stripeWebhookEvent.update({
      where: {
        id,
      },
      data: {
        attempts: { increment: 1 },
      },
    });
  }

  async findFailedWebhooks(payload: {
    page?: number;
    limit?: number;
  }): Promise<{
    data: StripeWebhookEvent[];
    meta: OffsetPaginationMeta;
  }> {
    const page = Math.max(payload.page ?? 1, 1);
    const limit = Math.min(Math.max(payload.limit ?? 15, 1), 100);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.stripeWebhookEvent.findMany({
        where: {
          status: WebhookEventStatus.FAILED,
        },
        skip,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.stripeWebhookEvent.count({
        where: {
          status: WebhookEventStatus.FAILED,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        type: "offset",
        total,
        totalPages,
        page,
        pageSize: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async updateSubscription(workspaceId: string, data: SubscriptionUpdateInput) {
    return prisma.subscription.update({
      where: {
        workspaceId,
      },
      data,
    });
  }
}
