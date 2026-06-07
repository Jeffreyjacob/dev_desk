import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import { globalRateLimit } from "./middlewares/ratelimit";
import cookieParser from "cookie-parser";
import { logger } from "./config/logger";
import { env } from "./config/env";
import { nanoid } from "zod";
import { HealthCheck } from "./shared/healthCheck/healthCheck";
import { errorHandlerMiddleware } from "./middlewares/errorHandler";
import { NotFoundMiddleware } from "./middlewares/notFoundHandler";

class App {
  public readonly express: Application;
  constructor() {
    this.express = express();
    this.setSecurityMiddlewares();
    this.setParsingMiddlwares();
    this.setLoggingMiddlwares();
    this.setRouteMiddlewares();
    this.setErrorMiddleware();
  }

  setSecurityMiddlewares() {
    this.express.use(helmet());
    this.express.use(
      cors({
        origin:
          env.NODE_ENV === "production" ? env.ALLOWED_ORIGIN.split(",") : "*",
        methods: ["GET", "POST", "PUT", "PATCH", "OPTIONS", "DELETE"],
        allowedHeaders: ["Authorization", "Content-Type"],
      })
    );
    this.express.use(globalRateLimit);
    this.express.use(compression());
  }
  setParsingMiddlwares() {
    this.express.use((req, res, next) => {
      if (req.originalUrl === "/api/v1/webhook") {
      } else {
        express.json()(req, res, next);
      }
    });
    this.express.use(express.urlencoded({ extended: true, limit: "10mb" }));
    this.express.set("trust proxy", 1);
    this.express.use(cookieParser());
  }
  setLoggingMiddlwares() {
    if (env.NODE_ENV === "development") {
      this.express.use(morgan("dev"));
    } else if (env.NODE_ENV === "production") {
      this.express.use(
        morgan("combined", {
          stream: {
            write: (message) => logger.info(message.trim()),
          },
        })
      );
    }
    this.express.use((req, res, next) => {
      const correlationId =
        (req.headers["x-correlation-id"] as string) ?? nanoid();
      req.headers["x-correlation-id"] = correlationId;
      req.requestId = correlationId;
      req.log = logger.child({ correlationId });
      res.setHeader("x-correlation-id", correlationId);
      next();
    });
  }

  setRouteMiddlewares() {
    const healthCheck = new HealthCheck();
    this.express.get("/health", async (_req, res) => {
      const health = await healthCheck.getHealth();
      const statusCode = health.status === "healthy" ? 200 : 503;
      res.status(statusCode).json(health);
    });
  }
  setErrorMiddleware() {
    this.express.use(NotFoundMiddleware);
    this.express.use(errorHandlerMiddleware);
  }
}

export const app = new App().express;
