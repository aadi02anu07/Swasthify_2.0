const Redis = require("ioredis");

const redis = new Redis({
  host:     process.env.REDIS_HOST || "127.0.0.1",
  port:     parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
  // Retry strategy: back off gracefully instead of hammering the server
  retryStrategy(times) {
    if (times > 10) {
      console.error("❌ Redis: too many retries, giving up.");
      return null;
    }
    return Math.min(times * 200, 2000); // wait up to 2s between retries
  },
});

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error",   (err) => console.error("❌ Redis error:", err.message));

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Store a refresh token tied to a user.
 * Key format: refresh:{userId}  →  token string
 * TTL matches JWT_REFRESH_EXPIRES_IN (default 30 days in seconds).
 */
const saveRefreshToken = async (userId, token) => {
  const ttl = parseInt(process.env.REDIS_REFRESH_TTL || "2592000"); // 30 days
  await redis.set(`refresh:${userId}`, token, "EX", ttl);
};

const getRefreshToken = async (userId) => {
  return redis.get(`refresh:${userId}`);
};

const deleteRefreshToken = async (userId) => {
  return redis.del(`refresh:${userId}`);
};

/**
 * Cache any value with a TTL (seconds).
 * Used for patient summaries, report data, etc.
 */
const cacheSet = async (key, value, ttlSeconds = 300) => {
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
};

const cacheGet = async (key) => {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
};

const cacheDel = async (key) => {
  return redis.del(key);
};

module.exports = {
  redis,
  saveRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  cacheSet,
  cacheGet,
  cacheDel,
};