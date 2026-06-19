import { Queue } from "bullmq";
import { getEmailQueue } from "./queues/email";
import { getDeadletterQueue } from "./queues/dlq";
import { getInviteQueue } from "./queues/invite";

export const allQueues4DLQ: Queue[] = [getEmailQueue(), getInviteQueue()];
export const allQueue: Queue[] = [
  getEmailQueue(),
  getDeadletterQueue(),
  getInviteQueue(),
];
