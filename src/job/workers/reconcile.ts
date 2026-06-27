import { Worker } from "bullmq";
import { reconcileSubscriptions } from "../processer/reconcile";
import { bullmqconnections } from "../../config/bullmq";
import { logger } from "../../config/logger";

export function createReconciliationWorker(): Worker {
  const worker = new Worker(
    "reconciliation",
    async (job) => {
      if (job.name === "reconcile-subscription") {
        await reconcileSubscriptions();
      }
    },
    {
      connection: bullmqconnections,
    }
  );

  worker.on("failed", (job, err) => {
    logger.error(
      { err, jobId: job?.id },
      "Reconcilation workeer job failed entirely"
    );
  });

  return worker;
}
