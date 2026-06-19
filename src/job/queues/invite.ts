import { Queue } from "bullmq";
import { bullmqconnections } from "../../config/bullmq";

let inviteQueue: Queue | null = null;

export function getInviteQueue(): Queue {
  if (!inviteQueue) {
    inviteQueue = new Queue("invite-expiry", {
      connection: bullmqconnections,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
  }

  return inviteQueue;
}
