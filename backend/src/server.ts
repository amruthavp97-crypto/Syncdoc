import http from "http";
import { createApp } from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { connectRedis } from "./config/redis";
import { attachSocketServer } from "./socket/syncServer";

async function main() {
  await connectDB();
  await connectRedis();

  const app = createApp();
  const server = http.createServer(app);
  attachSocketServer(server);

  server.listen(env.PORT, () => {
    console.log(`[syncdoc] API + Socket.io listening on :${env.PORT} (${env.NODE_ENV})`);
  });

  process.on("SIGTERM", () => {
    console.log("[syncdoc] SIGTERM received, shutting down");
    server.close(() => process.exit(0));
  });
}

main().catch((err) => {
  console.error("[syncdoc] fatal startup error:", err);
  process.exit(1);
});
