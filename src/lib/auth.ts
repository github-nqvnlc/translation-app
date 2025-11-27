import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

// JWT Secret - nên lưu trong environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';

// Token expiration times
export const ACCESS_TOKEN_EXPIRY = '24h'; // 24 hours
export const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
export const REMEMBER_ME_ACCESS_TOKEN_EXPIRY = '7d'; // 7 days
export const REMEMBER_ME_REFRESH_TOKEN_EXPIRY = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Token generation
export interface TokenPayload {
  userId: string;
  email: string;
  roles?: string[];
}

export function generateAccessToken(payload: TokenPayload, rememberMe = false): string {
  const expiresIn = rememberMe ? REMEMBER_ME_ACCESS_TOKEN_EXPIRY : ACCESS_TOKEN_EXPIRY;
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn,
    issuer: 'translation-app',
    audience: 'translation-app-users',
  });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: '30d',
    issuer: 'translation-app',
    audience: 'translation-app-users',
  });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'translation-app',
      audience: 'translation-app-users',
    }) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'translation-app',
      audience: 'translation-app-users',
    }) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

// Generate random token for email verification and password reset
export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

// Hash token for storage in database
export async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

// Verify token hash
export async function verifyTokenHash(
  token: string,
  hashedToken: string
): Promise<boolean> {
  return bcrypt.compare(token, hashedToken);
}

// Password validation
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Mật khẩu phải có ít nhất 8 ký tự');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất một chữ thường');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất một chữ hoa');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất một số');
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất một ký tự đặc biệt');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Get client IP address from request
export function getClientIp(request: Request): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

// Get user agent from request
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}

