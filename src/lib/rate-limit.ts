import { prisma } from '@/lib/prisma';
import { getClientIp } from '@/lib/auth';
import { NextRequest } from 'next/server';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  identifier?: string; // Custom identifier (email, IP, etc.)
  skipSuccessfulRequests?: boolean; // Don't count successful requests
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number; // Seconds until retry
}

/**
 * Rate limiting using database (LoginAttempt table)
 * Suitable for distributed systems
 */
export async function rateLimit(
  request: NextRequest,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { windowMs, maxRequests, identifier, skipSuccessfulRequests = false } = options;

  // Get identifier (IP address by default)
  const id = identifier || getClientIp(request);
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  // Count requests in the time window
  const count = await prisma.loginAttempt.count({
    where: {
      email: id.includes('@') ? id : undefined, // If identifier is email
      ipAddress: !id.includes('@') ? id : undefined, // If identifier is IP
      createdAt: {
        gte: windowStart,
      },
      ...(skipSuccessfulRequests ? { success: false } : {}),
    },
  });

  const remaining = Math.max(0, maxRequests - count);
  const resetTime = new Date(windowStart.getTime() + windowMs);
  const retryAfter = remaining === 0 ? Math.ceil((resetTime.getTime() - now.getTime()) / 1000) : undefined;

  return {
    success: remaining > 0,
    remaining,
    resetTime,
    retryAfter,
  };
}

/**
 * Simple in-memory rate limiting (for non-critical endpoints)
 * Note: This won't work in distributed systems
 */
const memoryStore = new Map<string, { count: number; resetTime: number }>();

export function simpleRateLimit(
  identifier: string,
  windowMs: number,
  maxRequests: number
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  const stored = memoryStore.get(key);

  // Clean up expired entries
  if (stored && stored.resetTime < now) {
    memoryStore.delete(key);
  }

  const current = memoryStore.get(key) || { count: 0, resetTime: now + windowMs };

  if (current.resetTime < now) {
    // Reset window
    current.count = 1;
    current.resetTime = now + windowMs;
    memoryStore.set(key, current);
    return {
      success: true,
      remaining: maxRequests - 1,
      resetTime: new Date(current.resetTime),
    };
  }

  current.count++;
  memoryStore.set(key, current);

  const remaining = Math.max(0, maxRequests - current.count);
  const retryAfter = remaining === 0 ? Math.ceil((current.resetTime - now) / 1000) : undefined;

  return {
    success: remaining >= 0,
    remaining,
    resetTime: new Date(current.resetTime),
    retryAfter,
  };
}

/**
 * Rate limit configuration for different endpoints
 */
export const RATE_LIMITS = {
  // Auth endpoints - strict limits
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  },
  register: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 registrations per hour
  },
  forgotPassword: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 requests per hour
  },
  verifyEmail: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 attempts per 15 minutes
  },
  resetPassword: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  },
  // General API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
} as const;

