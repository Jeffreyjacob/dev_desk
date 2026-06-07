import RedisStore, { RedisReply } from "rate-limit-redis";
import { redis } from "../config/redis";
import rateLimit from "express-rate-limit";
import { env } from "../config/env";

function getStore(prefix: string): RedisStore {
  return new RedisStore({
    prefix,
    sendCommand: (command: string, ...args: string[]) => {
      const client = redis;
      return client.call(command, ...args) as Promise<RedisReply>;
    },
  });
}

export const globalRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  legacyHeaders: false,
  standardHeaders: true,
  message: {
    success: false,
    message: "Too many request, please try again later",
  },
  store: getStore("global"),
});
