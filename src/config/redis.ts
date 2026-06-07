import Redis from "ioredis";
import { env } from "./env";
import { logger } from "./logger";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  ...(env.NODE_ENV === "production" && {
    tls: {},
  }),
  retryStrategy(times) {
    if (times > 10) return null;
    return Math.min(times * 500 * Math.pow(2, times), 30000);
  },
});

redis.on("connect", () => logger.info("Redis Connected"));
redis.on("error", (err) => logger.error({ err }, "Redis error"));
redis.on("end", () => {
  logger.error("Redis gave up connecting, shutting down");
});

export async function disconnectRedis(): Promise<void> {
  if (!redis) {
    logger.warn("redis not initialized");
    return;
  }
  return redis.disconnect();
}
