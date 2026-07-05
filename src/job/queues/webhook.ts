import { Queue } from "bullmq";
import { bullmqconnections } from "../../config/bullmq";

let webhookQueue: Queue;

export function getWebhookQueue(): Queue {
  if (!webhookQueue) {
    webhookQueue = new Queue("webhook", {
      connection: bullmqconnections,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: { count: 100 },
        removeOnFail: false,
      },
    });
  }

  return webhookQueue;
}
