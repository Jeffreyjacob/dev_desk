import { prisma } from "./config/database";
import { logger } from "./config/logger";
import { disconnectRedis } from "./config/redis";
import { createDLQWorker } from "./job/workers/dlq";
import { createEmailWorker } from "./job/workers/email";
import { createInviteWorker } from "./job/workers/invite";

export async function startWorker() {
  try {
    logger.info("starting worker");
    await prisma.$connect();
    const emailWorker = createEmailWorker();
    const deadletterWorker = createDLQWorker();
    const inviteExpiryWorker = createInviteWorker();

    const gracefulShutdown = async (signal: string) => {
      logger.info("starting graceful shutdown ...");

      const forceExiter = setTimeout(() => {
        logger.info("force shutdown");
        process.exit(1);
      }, 10_000);

      forceExiter.unref();

      try {
        await prisma.$disconnect();
        await emailWorker.close();
        await deadletterWorker.close();
        await inviteExpiryWorker.close();
        await disconnectRedis();
        logger.info("graceful shutdown shutdown");
        process.exit(0);
      } catch (error: any) {
        logger.fatal({ err: error }, "unable to gracefull shutdown server");
      }
    };
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("uncaughtException", (err) => {
      logger.fatal({ err }, "uncaught exeception worker");
      gracefulShutdown("uncaughtException");
    });
    process.on("unhandledRejection", (reason) => {
      logger.fatal({ reason }, " unhandledRejection worker");
      gracefulShutdown("unhandledRejection");
    });
  } catch (error: any) {
    logger.fatal({ error }, "Unable to start worker ");
    process.exit(1);
  }
}

startWorker();
