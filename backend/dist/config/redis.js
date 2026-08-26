"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
exports.connectRedis = connectRedis;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
exports.redis = new ioredis_1.default(env_1.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
});
exports.redis.on("error", (err) => {
    console.error("[redis] connection error:", err.message);
});
async function connectRedis() {
    await exports.redis.connect();
    console.log(`[redis] connected -> ${env_1.env.REDIS_URL}`);
}
//# sourceMappingURL=redis.js.map