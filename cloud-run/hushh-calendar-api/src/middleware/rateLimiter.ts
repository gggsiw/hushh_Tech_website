/**
 * Rate limiting middleware for Hushh Calendar API
 * Uses in-memory cache with Redis fallback for distributed environments
 */

import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';
import { config } from '../config';
import { logger } from '../utils/logger';

// In-memory cache for rate limiting (fallback if Redis not available)
const cache = new NodeCache({ stdTTL: 60, checkperiod: 30 });

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export async function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.apiKey) {
      next();
      return;
    }
    
    const apiKeyId = req.apiKey.id;
    const limit = req.apiKey.rateLimit || config.rateLimit.defaultLimit;
    const windowMs = config.rateLimit.windowMs;
    const now = Date.now();
    
    // Get current rate limit entry
    const cacheKey = `ratelimit:${apiKeyId}`;
    let entry = cache.get<RateLimitEntry>(cacheKey);
    
    if (!entry || now >= entry.resetAt) {
      // Create new entry
      entry = {
        count: 1,
        resetAt: now + windowMs,
      };
      cache.set(cacheKey, entry, Math.ceil(windowMs / 1000));
    } else {
      // Increment count
      entry.count++;
      cache.set(cacheKey, entry);
    }
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - entry.count).toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000).toString());
    
    // Check if over limit
    if (entry.count > limit) {
      logger.warn(`Rate limit exceeded for API key ${apiKeyId}`);
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded. Please retry after the reset time.',
          retryAfter: Math.ceil((entry.resetAt - now) / 1000),
        },
      });
      return;
    }
    
    next();
  } catch (err) {
    logger.error('Rate limiter error:', err);
    // On error, allow the request to proceed
    next();
  }
}
