import { Job } from "bullmq";
import { IWebhookDeliveryJobData } from "../../modules/webhook/webhook.interface";
import { prisma } from "../../config/database";
import { logger } from "../../config/logger";
import { signPayload } from "../workers/webhook";

export const WebhookProcessor = async (job: Job<IWebhookDeliveryJobData>) => {
  const { endpointId, deliveryId, payload, event } = job.data;

  const endpoint = await prisma.webhookEndpoint.findUnique({
    where: { id: endpointId },
  });

  if (!endpoint || !endpoint.isActive) {
    logger.warn(
      { endpointId },
      "Endpoint no longer active - skipping delivery"
    );
  }

  const payloadString = JSON.stringify(payload);
  const signature = signPayload(endpoint?.secret!, payloadString);

  const timestamp = Date.now();

  let responseStatus: number | null = null;
  let responseBody = "";

  try {
    const response = await fetch(endpoint?.url!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-DevDesk-Signature": `sha256=${signature}`,
        "X-DevDesk-Timestamp": String(timestamp),
        "X-DevDesk-Event": event,
      },
      body: payloadString,
      signal: AbortSignal.timeout(10_000),
    });

    responseStatus = response.status;
    responseBody = await response.text();

    if (response.ok) {
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "SUCCESS",
          responseStatus,
          responseBody: responseBody.slice(0, 1000),
          deliveredAt: new Date(),
          attempt: job.attemptsMade + 1,
        },
      });

      logger.info(
        {
          endpointId,
          event,
          responseStatus,
        },
        "Webhook delivered successfully"
      );
    } else {
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          responseStatus,
          responseBody: responseBody.slice(0, 1000),
          attempt: job.attemptsMade + 1,
        },
      });

      throw new Error(
        `Endpoint returned ${responseStatus}: ${responseBody.slice(0, 1000)}`
      );
    }
  } catch (error: any) {
    if (job.attemptsMade >= 4) {
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: "FAILED",
          responseStatus,
          responseBody: error.message.slice(0, 1000),
          attempt: job.attemptsMade + 1,
        },
      });

      logger.error(
        { endpointId, event, attempts: job.attemptsMade + 1 },
        " Webhook permanently failed after all retries"
      );
    }

    throw error;
  }
};
