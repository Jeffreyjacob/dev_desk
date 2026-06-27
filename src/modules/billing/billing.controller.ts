import { Request, Response } from "express";
import { BillingService } from "./billing.service";
import { ResponseHelper } from "../../shared/utils/apiResponse";
import Stripe from "stripe";
import { stripe } from "../../config/stripe";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { getFailedWebhookSchema } from "./billing.validation";

export class BillingController {
  constructor(private readonly service: BillingService) {}

  async createCheckOut(req: Request, res: Response) {
    const workspaceId = req.user!.workspaceId;
    const ownerEmail = req.user!.email;
    const result = await this.service.createCheckoutSession(
      workspaceId!,
      ownerEmail
    );
    req.log?.info({ email: ownerEmail, workspaceId }, "checkout created");
    ResponseHelper.success(res, result, 200, "checkout session created");
  }

  async getStatus(req: Request, res: Response) {
    const workspaceId = req.user?.workspaceId!;
    const result = await this.service.getBillingStatus(workspaceId);
    ResponseHelper.success(res, result, 200, "subscription status fetched");
  }

  async cancel(req: Request, res: Response) {
    const workspaceId = req.user!.workspaceId;
    const result = await this.service.cancelSubscription(workspaceId!);
    req.log?.info(
      { workspaceId, cancelledBy: req.user?.userId },
      "workspace subscription cancelled"
    );
    ResponseHelper.success(res, result, 200, "subscription cancelled");
  }

  async handleWebhook(req: Request, res: Response) {
    const signature = req.headers["stripe-signature"] as string;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      logger.warn({ err }, "Stripe signature verification failed");
      res.status(400).send("Invalid signture");
      return;
    }

    try {
      await this.service.processStripeEvent(event);
      res.status(200).json({ received: true });
    } catch (err: any) {
      logger.error({ err, eventType: event.type }, "Webhook processing failed");
      res.status(500).json({ recieved: false });
    }
  }

  async getFailedWebhooks(req: Request, res: Response) {
    const data = getFailedWebhookSchema.parse(req.query);
    const result = await this.service.getFailedWebhooks(data);
    ResponseHelper.success(res, result, 200, "Failed webhook fetched");
  }

  async replayWebhook(req: Request, res: Response) {
    const { eventId } = req.params;
    const result = await this.service.replyWebhookEvent(eventId as string);
    req.log?.info(
      { eventId, replayedBy: req.user?.userId },
      "Webhook Event replayed"
    );
    ResponseHelper.success(res, "", 200, result.message);
  }
}
