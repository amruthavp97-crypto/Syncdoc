"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = require("./app");
const env_1 = require("./config/env");
const db_1 = require("./config/db");
const redis_1 = require("./config/redis");
const syncServer_1 = require("./socket/syncServer");
async function main() {
    await (0, db_1.connectDB)();
    await (0, redis_1.connectRedis)();
    const app = (0, app_1.createApp)();
    const server = http_1.default.createServer(app);
    (0, syncServer_1.attachSocketServer)(server);
    server.listen(env_1.env.PORT, () => {
        console.log(`[syncdoc] API + Socket.io listening on :${env_1.env.PORT} (${env_1.env.NODE_ENV})`);
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
//# sourceMappingURL=server.js.map