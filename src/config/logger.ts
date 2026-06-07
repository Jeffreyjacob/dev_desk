import pino from "pino";
import { env } from "./env";

const isDev = env.NODE_ENV === "development";

export const logger = pino({
  level: isDev ? "debug" : "info",
  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
  }),
  redact: [
    "*.password",
    "*.token",
    "req.headers.authorization",
    "*.refreshtoken",
    "*.resetToken",
    "*.stripeCustomerId",
  ],
  base: {
    name: "dev desk api",
    env: env.NODE_ENV,
  },
});
