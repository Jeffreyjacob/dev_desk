import { prisma } from "../../config/database";
import { env } from "../../config/env";
import { redis } from "../../config/redis";
import { allQueue } from "../../job";

interface DependencyHealth {
  status: "healthy" | "unhealthy";
  latency: number;
  error?: string;
  counts?: Record<string, any>[];
}

interface HealthResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  dependencies: {
    database: DependencyHealth;
    redis: DependencyHealth;
    queue: DependencyHealth & { counts?: Record<string, any>[] };
  };
}

export class HealthCheck {
  private async checkDatabase(): Promise<DependencyHealth> {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: "healthy",
        latency: Date.now() - start,
      };
    } catch (err: any) {
      return {
        status: "unhealthy",
        latency: Date.now() - start,
        error: err.message,
      };
    }
  }

  private async checkRedis(): Promise<DependencyHealth> {
    const start = Date.now();
    try {
      await redis.ping();
      return {
        status: "healthy",
        latency: Date.now() - start,
      };
    } catch (err: any) {
      return {
        status: "unhealthy",
        latency: Date.now() - start,
        error: err.message,
      };
    }
  }

  private async checkQueue(): Promise<DependencyHealth> {
    const start = Date.now();
    try {
      const queues = await Promise.all(
        allQueue.map(async (queue) => ({
          [queue.name]: await queue.getJobCounts(),
        }))
      );
      return {
        status: "healthy",
        latency: Date.now() - start,
        counts: queues,
      };
    } catch (err: any) {
      return {
        status: "unhealthy",
        latency: Date.now() - start,
        error: err.message,
      };
    }
  }

  async getHealth(): Promise<HealthResponse> {
    const [database, redis, queue] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkQueue(),
    ]);

    const isHealthy =
      database.status === "healthy" &&
      redis.status === "healthy" &&
      queue.status === "healthy";

    return {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "1.0",
      environment: env.NODE_ENV,
      uptime: Math.floor(process.uptime()),
      dependencies: { database, redis, queue },
    };
  }
}
