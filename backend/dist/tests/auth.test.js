"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_memory_server_1 = require("mongodb-memory-server");
const mongoose_1 = __importDefault(require("mongoose"));
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../app");
let mongo;
beforeAll(async () => {
    mongo = await mongodb_memory_server_1.MongoMemoryServer.create();
    await mongoose_1.default.connect(mongo.getUri());
});
afterAll(async () => {
    await mongoose_1.default.disconnect();
    await mongo.stop();
});
afterEach(async () => {
    const collections = mongoose_1.default.connection.collections;
    for (const key of Object.keys(collections)) {
        await collections[key].deleteMany({});
    }
});
const app = (0, app_1.createApp)();
describe("Auth flow", () => {
    const credentials = { name: "Ada Lovelace", email: "ada@example.com", password: "correcthorsebattery" };
    it("registers a new user", async () => {
        const res = await (0, supertest_1.default)(app).post("/api/auth/register").send(credentials);
        expect(res.status).toBe(201);
        expect(res.body.user.email).toBe(credentials.email);
        expect(res.body.user.isEmailVerified).toBe(false);
    });
    it("rejects duplicate registration", async () => {
        await (0, supertest_1.default)(app).post("/api/auth/register").send(credentials);
        const res = await (0, supertest_1.default)(app).post("/api/auth/register").send(credentials);
        expect(res.status).toBe(409);
    });
    it("rejects login with wrong password", async () => {
        await (0, supertest_1.default)(app).post("/api/auth/register").send(credentials);
        const res = await (0, supertest_1.default)(app)
            .post("/api/auth/login")
            .send({ email: credentials.email, password: "wrong-password" });
        expect(res.status).toBe(401);
    });
    it("logs in and accesses a protected route with the access token", async () => {
        await (0, supertest_1.default)(app).post("/api/auth/register").send(credentials);
        const loginRes = await (0, supertest_1.default)(app)
            .post("/api/auth/login")
            .send({ email: credentials.email, password: credentials.password });
        expect(loginRes.status).toBe(200);
        expect(loginRes.body.accessToken).toBeTruthy();
        const meRes = await (0, supertest_1.default)(app)
            .get("/api/auth/me")
            .set("Authorization", `Bearer ${loginRes.body.accessToken}`);
        expect(meRes.status).toBe(200);
        expect(meRes.body.user.email).toBe(credentials.email);
    });
    it("rejects protected routes with no token", async () => {
        const res = await (0, supertest_1.default)(app).get("/api/auth/me");
        expect(res.status).toBe(401);
    });
});
//# sourceMappingURL=auth.test.js.map