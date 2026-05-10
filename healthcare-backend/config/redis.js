const Redis = require("ioredis");

// Upstash (and most cloud Redis) requires TLS.
// Use REDIS_URL if provided (recommended for cloud), 
// fall back to individual vars for local dev.
const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      tls: { rejectUnauthorized: false },
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) return null;
        return Math.min(times * 300, 2000);
      },
    })
  : new Redis({
      host:     process.env.REDIS_HOST || "127.0.0.1",
      port:     parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy(times) {
        if (times > 5) return null;
        return Math.min(times * 300, 2000);
      },
    });

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error",   (err) => console.error("❌ Redis error:", err.message));

const saveRefreshToken = async (userId, token) => {
  const ttl = parseInt(process.env.REDIS_REFRESH_TTL || "2592000");
  await redis.set(`refresh:${userId}`, token, "EX", ttl);
};

const getRefreshToken  = async (userId) => redis.get(`refresh:${userId}`);
const deleteRefreshToken = async (userId) => redis.del(`refresh:${userId}`);

const cacheSet = async (key, value, ttlSeconds = 300) => {
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
};
const cacheGet = async (key) => {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
};
const cacheDel = async (key) => redis.del(key);

module.exports = {
  redis,
  saveRefreshToken, getRefreshToken, deleteRefreshToken,
  cacheSet, cacheGet, cacheDel,
};