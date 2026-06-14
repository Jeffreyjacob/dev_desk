import { redis } from "../../config/redis";

export async function ensureIdempotency(jobId: string, workerType: string) {
  const key = `processed:${workerType}:${jobId}`;
  const acquired = await redis.set(key, "1", "EX", 86400, "NX");
  return acquired === "OK";
}

export async function clearIdemplotency(jobId: string, workerType: string) {
  const key = `processed:${workerType}:${jobId}`;
  await redis.del(key);
}
