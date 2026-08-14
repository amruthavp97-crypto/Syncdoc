import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { createApp } from "../app";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

const app = createApp();

describe("Auth flow", () => {
  const credentials = { name: "Ada Lovelace", email: "ada@example.com", password: "correcthorsebattery" };

  it("registers a new user", async () => {
    const res = await request(app).post("/api/auth/register").send(credentials);
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(credentials.email);
    expect(res.body.user.isEmailVerified).toBe(false);
  });

  it("rejects duplicate registration", async () => {
    await request(app).post("/api/auth/register").send(credentials);
    const res = await request(app).post("/api/auth/register").send(credentials);
    expect(res.status).toBe(409);
  });

  it("rejects login with wrong password", async () => {
    await request(app).post("/api/auth/register").send(credentials);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: "wrong-password" });
    expect(res.status).toBe(401);
  });

  it("logs in and accesses a protected route with the access token", async () => {
    await request(app).post("/api/auth/register").send(credentials);
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: credentials.password });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.accessToken).toBeTruthy();

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${loginRes.body.accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe(credentials.email);
  });

  it("rejects protected routes with no token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});
