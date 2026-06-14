import { Worker } from "bullmq";
import { emailProcesser } from "../processer/email";
import { bullmqconnections } from "../../config/bullmq";
import { logger } from "../../config/logger";
import { AppError } from "../../shared/errors";
import { isPermanentError, moveToDLQ } from "../../shared/utils/dlq.helper";

export const createEmailWorker = (): Worker => {
  const worker = new Worker("email", emailProcesser, {
    connection: bullmqconnections,
    concurrency: 3,
  });

  worker.on("ready", () => {
    logger.info("email worker is ready");
  });

  worker.on("completed", (job) => {
    logger.info({ email: job.data.message }, "email has been sent");
  });

  worker.on("failed", async (job, err) => {
    logger.warn({ email: job?.data.email, err }, "email failed to sent");

    if (!job) return;

    if (err instanceof AppError && isPermanentError(err)) {
      await moveToDLQ(job, err, "email");
      // send alert to team
      return;
    }

    const isLastAttempt = job.attemptsMade >= (job.opts.attempts ?? 1);
    if (!isLastAttempt) return;

    await moveToDLQ(job, err, job.queueName);
    // send alert to team
  });

  worker.on("error", (err) => {
    logger.error({ err }, "email worker error");
  });

  return worker;
};
