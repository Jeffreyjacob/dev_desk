import { Job, Queue } from "bullmq";
import { logger } from "../../config/logger";
import { allQueues4DLQ } from "..";

const queueMap: Record<string, Queue> = Object.fromEntries(
  allQueues4DLQ.map((queue) => [queue.name, queue])
);

interface DLQType {
  originalQueue: string;
  originalJobId: number;
  data: any;
  reason: any;
  stack: any;
  attemptsMade: number;
  failedAt: Date;
  errorType: any;
  errorCode: any;
}

export const dlqProcessor = async (job: Job<DLQType>) => {
  const {
    originalJobId,
    originalQueue,
    data,
    reason,
    errorCode,
    errorType,
    attemptsMade,
    failedAt,
  } = job.data;

  logger.error(
    {
      originalQueue,
      originalJobId,
      errorType,
      errorCode,
      reason,
    },
    `[DLQ] processing failed job`
  );

  if (errorType === "transient") {
    const originalQ = queueMap[originalQueue];
    if (!originalQ) {
      logger.warn(`[DLQ] No queue found for ${originalQueue}`);
      return;
    }

    await originalQ.add(`${originalQueue}:replayed`, data, {
      delay: 60 * 60 * 1000,
      attempts: 3,
      backoff: { type: "exponential", delay: 500 },
    });

    logger.info(`[DLQ] Replayed ${originalQueue} job ${originalJobId}`);
  }

  if (errorType === "permanent") {
    // BadRequestError, ValidationError, NotFoundError etc
    // retrying will never fix this - need human to look at the data
    // sendAlert

    logger.fatal(
      { originalQueue, originalJobId, errorCode, reason },
      `[DLQ] Permanent failure — human review needed`
    );

    return;
  }

  if (errorType === "unknown") {
    // sendAlert

    logger.fatal(
      { originalQueue, originalJobId, reason },
      "[DLQ] Unknown error — check your code"
    );
  }
};
