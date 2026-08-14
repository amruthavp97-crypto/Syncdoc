import Redis from "ioredis";
import { env } from "./env";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on("error", (err) => {
  console.error("[redis] connection error:", err.message);
});

export async function connectRedis(): Promise<void> {
  await redis.connect();
  console.log(`[redis] connected -> ${env.REDIS_URL}`);
}
