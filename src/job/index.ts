import { Queue } from "bullmq";
import { getEmailQueue } from "./queues/email";
import { getDeadletterQueue } from "./queues/dlq";

export const allQueues4DLQ: Queue[] = [getEmailQueue()];
export const allQueue: Queue[] = [getEmailQueue(), getDeadletterQueue()];
