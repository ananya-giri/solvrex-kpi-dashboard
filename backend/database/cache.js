import Redis from 'ioredis';

/**
 * Enterprise Caching Layer with Graceful Fallback
 * Provides high-throughput Redis caching for expensive KPI aggregation queries
 * with seamless in-memory fallback if Redis is unavailable (Zero Crash Guarantee).
 */
class CacheManager {
  constructor() {
    this.redis = null;
    this.memoryCache = new Map();
    this.isRedisReady = false;
    this.initRedis();
  }

  initRedis() {
    const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        enableOfflineQueue: false,
        retryStrategy: (times) => {
          if (times > 3) {
            // Stop retrying aggressively if Redis isn't deployed
            return null;
          }
          return Math.min(times * 500, 2000);
        }
      });

      this.redis.on('connect', () => {
        this.isRedisReady = true;
        console.log('[Cache] Connected to Redis distributed cache.');
      });

      this.redis.on('error', (err) => {
        this.isRedisReady = false;
        // Suppress continuous spam; log once
        if (err.code !== 'ECONNREFUSED') {
          console.warn('[Cache] Redis warning, using in-memory cache:', err.message);
        }
      });
    } catch (err) {
      this.isRedisReady = false;
    }
  }

  async get(key) {
    if (this.isRedisReady && this.redis) {
      try {
        const val = await this.redis.get(key);
        return val ? JSON.parse(val) : null;
      } catch (err) {
        // Fallback to memory cache
      }
    }

    // In-memory fallback
    const entry = this.memoryCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.memoryCache.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key, value, ttlSeconds = 60) {
    const serialized = JSON.stringify(value);

    if (this.isRedisReady && this.redis) {
      try {
        await this.redis.set(key, serialized, 'EX', ttlSeconds);
        return true;
      } catch (err) {
        // Fallback to memory
      }
    }

    // In-memory cache
    this.memoryCache.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000
    });
    return true;
  }

  async del(patternOrKey) {
    if (this.isRedisReady && this.redis) {
      try {
        if (patternOrKey.includes('*')) {
          const keys = await this.redis.keys(patternOrKey);
          if (keys.length > 0) {
            await this.redis.del(...keys);
          }
        } else {
          await this.redis.del(patternOrKey);
        }
      } catch (err) {
        // Ignore
      }
    }

    // Clear matching keys in memory cache
    if (patternOrKey.includes('*')) {
      const regex = new RegExp('^' + patternOrKey.replace(/\*/g, '.*') + '$');
      for (const k of this.memoryCache.keys()) {
        if (regex.test(k)) this.memoryCache.delete(k);
      }
    } else {
      this.memoryCache.delete(patternOrKey);
    }
    return true;
  }

  async flush() {
    if (this.isRedisReady && this.redis) {
      try {
        await this.redis.flushdb();
      } catch (e) {}
    }
    this.memoryCache.clear();
  }

  getStatus() {
    return {
      provider: this.isRedisReady ? 'Redis' : 'In-Memory (Fallback)',
      connected: this.isRedisReady,
      memoryEntriesCount: this.memoryCache.size
    };
  }
}

export const cache = new CacheManager();

/**
 * Express Route Caching Middleware
 * Automatically caches GET responses with configurable TTL
 */
export const cacheRoute = (ttlSeconds = 60) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();

    const cacheKey = `kpi_cache:${req.user ? req.user.role : 'anon'}:${req.originalUrl}`;
    try {
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        res.setHeader('X-Cache-Status', 'HIT');
        return res.json(cachedData);
      }
    } catch (e) {
      // Continue without cache
    }

    res.setHeader('X-Cache-Status', 'MISS');
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, body, ttlSeconds).catch(() => {});
      }
      return originalJson(body);
    };

    next();
  };
};

export default cache;
