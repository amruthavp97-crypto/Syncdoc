import mongoose from "mongoose";
import { env } from "./env";

export async function connectDB(): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGO_URI);
  console.log(`[mongo] connected -> ${env.MONGO_URI}`);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
