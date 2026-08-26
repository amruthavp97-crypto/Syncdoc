"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
exports.disconnectDB = disconnectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
async function connectDB() {
    mongoose_1.default.set("strictQuery", true);
    await mongoose_1.default.connect(env_1.env.MONGO_URI);
    console.log(`[mongo] connected -> ${env_1.env.MONGO_URI}`);
}
async function disconnectDB() {
    await mongoose_1.default.disconnect();
}
//# sourceMappingURL=db.js.map