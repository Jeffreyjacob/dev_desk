import crypto from "crypto";
import { WebhookProcessor } from "../processer/webhook";
import { Worker } from "bullmq";
import { bullmqconnections } from "../../config/bullmq";
import { logger } from "../../config/logger";

export function signPayload(secret: string, payload: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payload, "utf-8")
    .digest("hex");
}

export function createWebhookWorker(): Worker {
  const worker = new Worker("webhook", WebhookProcessor, {
    connection: bullmqconnections,
    concurrency: 10,
  });

  worker.on("failed", (job, err) => {
    logger.error(
      { err, jobId: job?.id, endpointId: job?.data.endpointId },
      "Webhook delivery job failed"
    );
  });

  return worker;
}
