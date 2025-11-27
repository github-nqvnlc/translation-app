import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import {
  verifyPassword,
  validateEmail,
  generateAccessToken,
  generateRefreshToken,
  getClientIp,
  getUserAgent,
} from '@/lib/auth';

// Rate limiting: max 5 failed attempts per 15 minutes
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function checkRateLimit(email: string, _ipAddress: string): Promise<{
  allowed: boolean;
  remainingAttempts?: number;
  lockoutUntil?: Date;
}> {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  // Count failed attempts in last 15 minutes
  const failedAttempts = await prisma.loginAttempt.count({
    where: {
      email: email.toLowerCase(),
      success: false,
      createdAt: {
        gte: fifteenMinutesAgo,
      },
    },
  });

  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    // Get the most recent failed attempt to calculate lockout
    const lastAttempt = await prisma.loginAttempt.findFirst({
      where: {
        email: email.toLowerCase(),
        success: false,
        createdAt: {
          gte: fifteenMinutesAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (lastAttempt) {
      const lockoutUntil = new Date(
        lastAttempt.createdAt.getTime() + LOCKOUT_DURATION
      );
      if (lockoutUntil > new Date()) {
        return {
          allowed: false,
          lockoutUntil,
        };
      }
    }
  }

  return {
    allowed: true,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - failedAttempts),
  };
}

async function recordLoginAttempt(
  email: string,
  ipAddress: string,
  userAgent: string,
  success: boolean,
  failureReason?: string
) {
  await prisma.loginAttempt.create({
    data: {
      email: email.toLowerCase(),
        ipAddress,
      userAgent,
      success,
      failureReason,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe = false } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email và mật khẩu là bắt buộc' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    // Check rate limiting
    const rateLimitCheck = await checkRateLimit(email.toLowerCase(), ipAddress);
    if (!rateLimitCheck.allowed) {
      await recordLoginAttempt(
        email.toLowerCase(),
        ipAddress,
        userAgent,
        false,
        'account_locked'
      );
      return NextResponse.json(
        {
          success: false,
          error: 'Tài khoản đã bị khóa tạm thời do quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.',
        },
        { status: 429 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        systemRole: true,
        projectMemberships: {
          select: {
            role: true,
            projectId: true,
          },
        },
      },
    });

    // Always return generic error to prevent email enumeration
    const genericError = {
      success: false,
      error: 'Email hoặc mật khẩu không đúng',
    };

    if (!user) {
      await recordLoginAttempt(
        email.toLowerCase(),
        ipAddress,
        userAgent,
        false,
        'user_not_found'
      );
      return NextResponse.json(genericError, { status: 401 });
    }

    // Check if user has password (not OAuth-only)
    if (!user.passwordHash) {
      await recordLoginAttempt(
        email.toLowerCase(),
        ipAddress,
        userAgent,
        false,
        'no_password_set'
      );
      return NextResponse.json(
        {
          success: false,
          error: 'Tài khoản này sử dụng đăng nhập OAuth. Vui lòng đăng nhập bằng Google/GitHub.',
        },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      await recordLoginAttempt(
        email.toLowerCase(),
        ipAddress,
        userAgent,
        false,
        'invalid_password'
      );
      return NextResponse.json(genericError, { status: 401 });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      await recordLoginAttempt(
        email.toLowerCase(),
        ipAddress,
        userAgent,
        false,
        'email_not_verified'
      );
      return NextResponse.json(
        {
          success: false,
          error: 'Vui lòng xác minh email trước khi đăng nhập.',
          requiresVerification: true,
        },
        { status: 403 }
      );
    }

    // Get user roles
    const roles: string[] = [];
    if (user.systemRole) {
      roles.push(user.systemRole.role);
    }
    // Add project roles if needed (can be used for permission checking)

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      roles,
    };

    generateAccessToken(tokenPayload, rememberMe); // Token is set in cookie, not used directly
    const refreshToken = generateRefreshToken(tokenPayload);

    // Calculate token expiry
    const refreshTokenExpiry = rememberMe
      ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Store refresh token in database
    // Note: We store token plaintext for lookup, and tokenHash for security
    // In production, consider storing only hash and using a different lookup mechanism
    const { hashToken } = await import('@/lib/auth');
    const tokenHash = await hashToken(refreshToken);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        tokenHash: tokenHash,
        userId: user.id,
        expiresAt: refreshTokenExpiry,
        ipAddress,
        userAgent,
      },
    });

    // Create session
    const sessionToken = await import('crypto').then((crypto) =>
      crypto.randomBytes(32).toString('hex')
    );

    const sessionExpiry = rememberMe
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expiresAt: sessionExpiry,
        ipAddress,
        userAgent,
      },
    });

    // Update user last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    // Record successful login
    await recordLoginAttempt(email, ipAddress, userAgent, true);

    // Set cookies
    const cookieStore = await cookies();
    cookieStore.set('session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60, // 7 days or 24 hours
      path: '/',
    });

    cookieStore.set('refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 90 * 24 * 60 * 60 : 30 * 24 * 60 * 60, // 90 days or 30 days
      path: '/',
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
          image: user.image,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}

