import { Worker } from "bullmq";
import { dlqProcessor } from "../processer/dlq";
import { bullmqconnections } from "../../config/bullmq";
import { logger } from "../../config/logger";

export const createDLQWorker = (): Worker => {
  const worker = new Worker("dead-letter", dlqProcessor, {
    connection: bullmqconnections,
    concurrency: 1,
  });

  worker.on("ready", () => {
    logger.info("dlq worker is ready");
  });

  worker.on("failed", (job, err) => {
    logger.fatal(
      {
        err,
      },
      "[DLQ] DLQ worker itself failed:"
    );

    // sendAlert
  });

  worker.on("error", (err) => {
    logger.error({ err }, "[DLQ] DLQ worker error:");
  });

  return worker;
};
