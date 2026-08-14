process.env.NODE_ENV = "test";
process.env.MONGO_URI = "mongodb://127.0.0.1:27017/syncdoc-test"; // overridden at runtime by mongodb-memory-server
process.env.REDIS_URL = "redis://127.0.0.1:6379";
process.env.JWT_ACCESS_SECRET = "test_access_secret_at_least_10_chars";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_at_least_10_chars";
process.env.CLIENT_URL = "http://localhost:5173";
