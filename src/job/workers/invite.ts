import { Worker } from "bullmq";
import { inviteWorkerProcesser } from "../processer/invite";
import { bullmqconnections } from "../../config/bullmq";
import { logger } from "../../config/logger";
import { AppError } from "../../shared/errors";
import { isPermanentError, moveToDLQ } from "../../shared/utils/dlq.helper";

export function createInviteWorker(): Worker {
  const worker = new Worker("invite-expiry", inviteWorkerProcesser, {
    connection: bullmqconnections,
  });

  worker.on("ready", () => {
    logger.info("invite expiry job is ready");
  });

  worker.on("completed", (job) => {
    logger.info(`invite ${job.data.inviteId} has been completed`);
  });

  worker.on("failed", async (job, err) => {
    logger.warn({ inviteId: job?.data.inviteId }, "invite failed to run");
    if (!job) return;

    if (err instanceof AppError && isPermanentError(err)) {
      await moveToDLQ(job, err, job.queueName);
      // send alert to team

      return;
    }

    const isLastAttempt = job.attemptsMade >= (job.opts.attempts ?? 1);
    if (!isLastAttempt) return;

    await moveToDLQ(job, err, job.queueName);
  });

  worker.on("error", (err) => {
    logger.error({ err }, "invite expiry worker error");
  });

  return worker;
}
