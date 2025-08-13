import { Redis } from '@upstash/redis';

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('Missing Upstash Redis environment variables');
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Cache keys
export const CACHE_KEYS = {
  USER_PROFILE: (userId: string) => `user:${userId}:profile`,
  USER_SUBSCRIPTION: (userId: string) => `user:${userId}:subscription`,
  CONTRACT_ANALYSIS: (contractId: string) => `contract:${contractId}:analysis`,
  RATE_LIMIT: (identifier: string) => `rate_limit:${identifier}`,
  SESSION: (sessionId: string) => `session:${sessionId}`,
  USAGE_STATS: (userId: string, period: string) => `usage:${userId}:${period}`,
} as const;

// Cache TTL in seconds
export const CACHE_TTL = {
  USER_PROFILE: 3600, // 1 hour
  USER_SUBSCRIPTION: 1800, // 30 minutes
  CONTRACT_ANALYSIS: 86400, // 24 hours
  RATE_LIMIT: 900, // 15 minutes
  SESSION: 3600, // 1 hour
  USAGE_STATS: 1800, // 30 minutes
} as const;

// Helper functions for caching
export async function setCache<T>(key: string, value: T, ttl?: number): Promise<void> {
  try {
    if (ttl) {
      await redis.setex(key, ttl, JSON.stringify(value));
    } else {
      await redis.set(key, JSON.stringify(value));
    }
  } catch (error) {
    console.error('Error setting cache:', error);
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key);
    if (!value) return null;
    return JSON.parse(value as string) as T;
  } catch (error) {
    console.error('Error getting cache:', error);
    return null;
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Error deleting cache:', error);
  }
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Error deleting cache pattern:', error);
  }
}

// Rate limiting functions
export async function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 900000 // 15 minutes
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  try {
    const key = CACHE_KEYS.RATE_LIMIT(identifier);
    const current = await redis.get(key);
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!current) {
      // First request in window
      await redis.setex(key, Math.ceil(windowMs / 1000), JSON.stringify([now]));
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: now + windowMs,
      };
    }
    
    const requests = JSON.parse(current as string) as number[];
    // Filter out requests outside the current window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: validRequests[0] + windowMs,
      };
    }
    
    // Add current request
    validRequests.push(now);
    await redis.setex(key, Math.ceil(windowMs / 1000), JSON.stringify(validRequests));
    
    return {
      allowed: true,
      remaining: maxRequests - validRequests.length,
      resetTime: now + windowMs,
    };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // Allow request on error to avoid blocking users
    return {
      allowed: true,
      remaining: maxRequests,
      resetTime: Date.now() + windowMs,
    };
  }
}

// Session management
export async function setSession(sessionId: string, data: Record<string, unknown>): Promise<void> {
  await setCache(CACHE_KEYS.SESSION(sessionId), data, CACHE_TTL.SESSION);
}

export async function getSession(sessionId: string): Promise<Record<string, unknown> | null> {
  return await getCache(CACHE_KEYS.SESSION(sessionId));
}

export async function deleteSession(sessionId: string): Promise<void> {
  await deleteCache(CACHE_KEYS.SESSION(sessionId));
}

// Usage statistics caching
export async function cacheUsageStats(userId: string, period: string, stats: Record<string, unknown>): Promise<void> {
  await setCache(CACHE_KEYS.USAGE_STATS(userId, period), stats, CACHE_TTL.USAGE_STATS);
}

export async function getCachedUsageStats(userId: string, period: string): Promise<Record<string, unknown> | null> {
  return await getCache(CACHE_KEYS.USAGE_STATS(userId, period));
}

// Contract analysis caching
export async function cacheContractAnalysis(contractId: string, analysis: Record<string, unknown>): Promise<void> {
  await setCache(CACHE_KEYS.CONTRACT_ANALYSIS(contractId), analysis, CACHE_TTL.CONTRACT_ANALYSIS);
}

export async function getCachedContractAnalysis(contractId: string): Promise<Record<string, unknown> | null> {
  return await getCache(CACHE_KEYS.CONTRACT_ANALYSIS(contractId));
}

// User profile caching
export async function cacheUserProfile(userId: string, profile: Record<string, unknown>): Promise<void> {
  await setCache(CACHE_KEYS.USER_PROFILE(userId), profile, CACHE_TTL.USER_PROFILE);
}

export async function getCachedUserProfile(userId: string): Promise<Record<string, unknown> | null> {
  return await getCache(CACHE_KEYS.USER_PROFILE(userId));
}

export async function invalidateUserCache(userId: string): Promise<void> {
  await Promise.all([
    deleteCache(CACHE_KEYS.USER_PROFILE(userId)),
    deleteCache(CACHE_KEYS.USER_SUBSCRIPTION(userId)),
    deleteCachePattern(CACHE_KEYS.USAGE_STATS(userId, '*')),
  ]);
}