import { Job } from "bullmq";
import { AppError, ConflictError } from "../errors";
import { getDeadletterQueue } from "../../job/queues/dlq";

export function isTransientError(err: Error): boolean {
  const transientMessage = [
    "ECONNREFUSED", // connection refused
    "ETIMEDOUT", // request timed out
    "ENOTFOUND", // DNS lookup failed
    "socket hang up", // connection dropped
    "SMTP",
  ];

  return transientMessage.some((msg) =>
    err.message.toLocaleUpperCase().includes(msg.toLocaleUpperCase())
  );
}

export function isPermanentError(err: Error): boolean {
  if (err instanceof AppError) {
    return true;
  }
  return false;
}

export function classifyError(
  err: Error
): "transient" | "permanent" | "unknown" {
  if (isTransientError(err)) return "transient";
  if (err instanceof AppError) {
    switch (err.statusCode) {
      case 400:
      case 422:
      case 404:
      case 409:
      case 403:
        return "permanent";

      case 401:
      case 429:
        return "transient";

      case 500:
        return "transient";

      default:
        return "unknown";
    }
  }

  return "unknown";
}

export async function moveToDLQ(job: Job, err: Error, workType: string) {
  const errorType = classifyError(err);

  await getDeadletterQueue().add(`${workType}:failed`, {
    originalQueue: workType,
    originalJobId: job.id,
    data: job.data,
    reason: err.message,
    stack: err.stack,
    attemptsMade: job.attemptsMade,
    failedAt: new Date().toISOString(),
    errorType,
    errorCode: err instanceof AppError ? err.code : undefined,
  });
}
