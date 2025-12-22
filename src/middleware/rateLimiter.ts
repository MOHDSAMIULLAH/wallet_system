import { Request, Response, NextFunction } from "express";
import { createHttpError } from "../utils/httpError";

/**
 * Rate limiting middleware (simple in-memory implementation)
 * For production, use redis-based rate limiting
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(
        (ts) => now - ts < this.windowMs
      );
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const identifier = req.ip || "unknown";
      const now = Date.now();

      const timestamps = this.requests.get(identifier) || [];
      const recentTimestamps = timestamps.filter(
        (ts) => now - ts < this.windowMs
      );

      if (recentTimestamps.length >= this.maxRequests) {
        throw createHttpError(429, "Too many requests, please try again later");
      }

      recentTimestamps.push(now);
      this.requests.set(identifier, recentTimestamps);

      next();
    };
  }
}

export const rateLimiter = new RateLimiter(60000, 100); // 100 requests per minute
