import { Queue } from "bullmq";
import { bullmqconnections } from "../../config/bullmq";

let deadletterQueue: Queue | null = null;
export const getDeadletterQueue = (): Queue => {
  if (!deadletterQueue) {
    deadletterQueue = new Queue("dead-letter", {
      connection: bullmqconnections,
      defaultJobOptions: {
        removeOnComplete: false,
        removeOnFail: false,
      },
    });
  }

  return deadletterQueue;
};
