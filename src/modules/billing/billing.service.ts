import Stripe from "stripe";
import { env } from "../../config/env";
import { stripe } from "../../config/stripe";
import { Subscription } from "../../generated/prisma/client";
import {
  SubscriptionStatus,
  WorkspacePlan,
} from "../../generated/prisma/enums";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../shared/errors";
import { WorkspaceRepository } from "../workspace/workspace.repository";
import { BillingRepository } from "./billing.repository";
import { prisma } from "../../config/database";
import { logger } from "../../config/logger";
import { error } from "node:console";

export class BillingService {
  constructor(
    private readonly billingRepo: BillingRepository,
    private readonly workspaceRepo: WorkspaceRepository
  ) {}

  async createCheckoutSession(
    workspaceId: string,
    ownerEmail: string
  ): Promise<{ checkoutUrl: string }> {
    const workspace = await this.workspaceRepo.findById(workspaceId);
    if (!workspace) throw new NotFoundError("unable to find workspace");
    let stripeCustomerId = workspace.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: ownerEmail,
        metadata: { workspaceId },
      });
      stripeCustomerId = customer.id;
      await this.workspaceRepo.updateById(workspaceId, { stripeCustomerId });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
      success_url: `${env.FRONTEND_URL}/billings?success=true`,
      cancel_url: `${env.FRONTEND_URL}/billing?cancelled=true`,
      metadata: { workspaceId },
    });

    return { checkoutUrl: session.url! };
  }

  async getBillingStatus(
    workspaceId: string
  ): Promise<{ plan: WorkspacePlan; subscription: Subscription | null }> {
    const subscription = await this.billingRepo.findByWorkspaceId(workspaceId);
    if (!subscription) {
      return { plan: WorkspacePlan.FREE, subscription: null };
    }
    return { plan: subscription.plan, subscription };
  }

  async cancelSubscription(workspaceId: string) {
    const subscription = await this.billingRepo.findByWorkspaceId(workspaceId);
    if (!subscription) throw new NotFoundError("No acrive subscription");

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await this.billingRepo.updateSubscription(workspaceId, {
      cancelledAt: new Date(),
      cancelAtPeriodEnd: true,
    });

    return { message: "Subscription will cancel at the end of the billing" };
  }

  async getFailedWebhooks(data: { page?: number; limit?: number }) {
    return this.billingRepo.findFailedWebhooks(data);
  }

  async replyWebhookEvent(eventId: string) {
    const record = await prisma.stripeWebhookEvent.findUnique({
      where: { id: eventId },
    });

    if (!record) throw new NotFoundError("Webhook event not found");
    if (record.status === "PROCESSED") {
      throw new ConflictError("This event was already processed");
    }

    try {
      await this.processStripeEvent(record.payload as unknown as Stripe.Event);
      await this.billingRepo.markWebhookProcessed(record.id);

      return { message: "Event replayed and processed susccessfully!" };
    } catch (err: any) {
      await this.billingRepo.markWebhookFailed(record.id, err.message);
      await this.billingRepo.incrementWebhookAttempts(record.id);
      throw new BadRequestError(`Replay failed again: ${err.message}`);
    }
  }

  async processStripeEvent(event: Stripe.Event) {
    switch (event.type) {
      case "checkout.session.completed":
        await this.handleCheckOutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      case "customer.subscription.updated":
        await this.handleSubscriptionUpdate(
          event.data.object as Stripe.Subscription,
          event.created
        );
        break;
      case "customer.subscription.deleted":
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;
      case "invoice.paid":
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      default:
        logger.info(
          { type: event.type },
          "Unhandled Stripe event type — ignored on purpose"
        );
    }
  }

  private async handleCheckOutCompleted(session: Stripe.Checkout.Session) {
    const workspaceId = session.metadata?.workspaceId;
    if (!workspaceId) {
      logger.error(
        { sessionId: session.id },
        "Checkout session missing workspaceId metadata"
      );
      return;
    }

    const stripeSubscriptionId = session.subscription as string;
    const subscription =
      await stripe.subscriptions.retrieve(stripeSubscriptionId);

    await this.billingRepo.createSubscription({
      workspaceId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      plan: WorkspacePlan.PRO,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(
        subscription.items.data[0].current_period_start * 1000
      ),
      currentPeriodEnd: new Date(
        subscription.items.data[0].current_period_end * 1000
      ),
    });

    await this.workspaceRepo.updateById(workspaceId, {
      plan: WorkspacePlan.PRO,
      maxMembers: 999999,
      maxProjects: 999999,
      webhooksEnabled: true,
    });

    logger.info({ workspaceId }, "Workspace upgraded to PRO");
  }

  private async handleSubscriptionUpdate(
    subscription: Stripe.Subscription,
    eventCreatedAt: number
  ) {
    const existing = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!existing) {
      logger.error(
        { subId: subscription.id },
        "Got update for unknown subscription"
      );
      return;
    }

    if (
      existing.lastEventTimestamp &&
      eventCreatedAt <= existing.lastEventTimestamp.getTime() / 1000
    ) {
      logger.warn(
        { subId: subscription.id },
        "Ignoring stale out-of-order event"
      );
      return;
    }

    const statusMap: Record<string, SubscriptionStatus> = {
      trialing: "TRIALING",
      active: "ACTIVE",
      past_due: "PAST_DUE",
      cancelled: "CANCELLED",
      unpaid: "EXPIRED",
    };

    const newStatus = statusMap[subscription.status];

    const updated = await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: newStatus,
        currentPeriodEnd: new Date(
          subscription.items.data[0].current_period_end * 1000
        ),
        currentPeriodStart: new Date(
          subscription.items.data[0].current_period_start * 1000
        ),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        lastEventTimestamp: new Date(eventCreatedAt * 1000),
      },
    });

    if (["PAST_DUE", "CANCELLED", "EXPIRED"].includes(newStatus)) {
      await prisma.workspace.update({
        where: { id: updated.workspaceId },
        data: {
          plan: WorkspacePlan.FREE,
          maxMembers: 5,
          maxProjects: 3,
          webhooksEnabled: false,
        },
      });
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    await this.billingRepo.syncFromStripe(subscription.id, {
      status: SubscriptionStatus.CANCELLED,
    });

    const sub = await this.billingRepo.findByStripeSubscriptionId(
      subscription.id
    );
    if (sub) {
      await prisma.workspace.update({
        where: { id: sub.workspaceId },
        data: {
          plan: WorkspacePlan.FREE,
          maxMembers: 5,
          maxProjects: 3,
          webhooksEnabled: false,
        },
      });
      logger.info(
        { workspaceId: sub.workspaceId },
        "Workspace downgraded to FREE"
      );
    }
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.parent?.subscription_details?.subscription;
    if (!subscriptionId) {
      console.log("unable to subscription in invoice ");
      return;
    }
    const subscription = await this.billingRepo.findByStripeSubscriptionId(
      subscriptionId as string
    );

    if (!subscription) {
      console.log("unable to find subscription in databse");
      return;
    }

    await this.billingRepo.createBillingHistory({
      workspaceId: subscription.workspaceId,
      subscriptionId: subscription.id,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      invoiceUrl: invoice.hosted_invoice_url ?? undefined,
    });
  }
}
