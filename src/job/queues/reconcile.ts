import { Queue } from "bullmq";
import { bullmqconnections } from "../../config/bullmq";
import { logger } from "../../config/logger";

let reconciliationQueue: Queue;

export function getReconciliationQueue(): Queue {
  if (!reconciliationQueue) {
    reconciliationQueue = new Queue("reconciliation", {
      connection: bullmqconnections,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      },
    });
  }

  return reconciliationQueue;
}

export async function scheduleReconciliation(): Promise<void> {
  const queue = getReconciliationQueue();

  const existingJobs = await queue.getRepeatableJobs();

  const alreadyScheduled = existingJobs.some(
    (job) => job.name === "reconcile-subscription"
  );

  if (alreadyScheduled) {
    logger.info("Reconciliation job already scheduled - skipping");
    return;
  }

  await queue.add(
    "reconcile-subscription",
    {},
    { repeat: { pattern: "0 3 * * *" } }
  );

  logger.info("Reconciliation job scheduled for 3am");
}
