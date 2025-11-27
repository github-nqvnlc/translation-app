import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAccessToken, generateRefreshToken, hashToken } from '@/lib/auth';
import { cookies } from 'next/headers';

interface OAuthUserInfo {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

/**
 * GET /api/auth/oauth/:provider/callback
 * Handle OAuth callback from provider
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;

    if (provider !== 'google' && provider !== 'github') {
      return NextResponse.redirect(
        `${process.env.APP_URL || 'http://localhost:3000'}/login?error=invalid_provider`
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      return NextResponse.redirect(
        `${process.env.APP_URL || 'http://localhost:3000'}/login?error=oauth_error`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.APP_URL || 'http://localhost:3000'}/login?error=missing_code_or_state`
      );
    }

    // Verify state
    const cookieStore = await cookies();
    const storedState = cookieStore.get(`oauth_state_${provider}`)?.value;

    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        `${process.env.APP_URL || 'http://localhost:3000'}/login?error=invalid_state`
      );
    }

    // Exchange code for access token and get user info
    const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/oauth/${provider}/callback`;
    let userInfo: OAuthUserInfo;

    try {
      if (provider === 'google') {
        userInfo = await handleGoogleCallback(code, redirectUri);
      } else {
        userInfo = await handleGitHubCallback(code, redirectUri);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      return NextResponse.redirect(
        `${process.env.APP_URL || 'http://localhost:3000'}/login?error=oauth_failed`
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: userInfo.email },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: userInfo.email,
          name: userInfo.name,
          image: userInfo.image,
          emailVerified: true, // OAuth emails are pre-verified
          emailVerifiedAt: new Date(),
        },
      });
    } else {
      // Update user info if needed
      if (!user.emailVerified) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerified: true,
            emailVerifiedAt: new Date(),
            name: userInfo.name || user.name,
            image: userInfo.image || user.image,
          },
        });
      } else {
        // Update name and image if changed
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: userInfo.name || user.name,
            image: userInfo.image || user.image,
          },
        });
      }
    }

    // Find or create account
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId: userInfo.id,
        },
      },
      update: {
        userId: user.id,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        type: 'oauth',
        provider,
        providerAccountId: userInfo.id,
      },
    });

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
    };

    generateAccessToken(tokenPayload); // Access token is not stored, only used in JWT
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    const refreshTokenHash = await hashToken(refreshToken);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken, // Store plain token for lookup (will be hashed in tokenHash)
        tokenHash: refreshTokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // Create session
    const sessionToken = crypto.randomUUID();
    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    // Redirect to projects page with cookies set
    const response = NextResponse.redirect(
      `${process.env.APP_URL || 'http://localhost:3000'}/projects`
    );

    response.cookies.set('session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    response.cookies.set('refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    // Clear OAuth state cookie
    response.cookies.delete(`oauth_state_${provider}`);

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.APP_URL || 'http://localhost:3000'}/login?error=oauth_failed`
    );
  }
}

async function handleGoogleCallback(
  code: string,
  redirectUri: string
): Promise<OAuthUserInfo> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth chưa được cấu hình');
  }

  // Exchange code for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('Google token error:', errorText);
    throw new Error('Không thể lấy access token từ Google');
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  // Get user info
  const userResponse = await fetch(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!userResponse.ok) {
    throw new Error('Không thể lấy thông tin user từ Google');
  }

  const userData = await userResponse.json();

  return {
    id: userData.id,
    email: userData.email,
    name: userData.name || null,
    image: userData.picture || null,
  };
}

async function handleGitHubCallback(
  code: string,
  redirectUri: string
): Promise<OAuthUserInfo> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('GitHub OAuth chưa được cấu hình');
  }

  // Exchange code for access token
  const tokenResponse = await fetch(
    'https://github.com/login/oauth/access_token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    }
  );

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('GitHub token error:', errorText);
    throw new Error('Không thể lấy access token từ GitHub');
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  // Get user info
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!userResponse.ok) {
    throw new Error('Không thể lấy thông tin user từ GitHub');
  }

  const userData = await userResponse.json();

  // Get user email (may need to fetch from emails endpoint)
  let email = userData.email;
  if (!email) {
    const emailsResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (emailsResponse.ok) {
      const emails = await emailsResponse.json();
      const primaryEmail = emails.find((e: { primary: boolean }) => e.primary);
      email = primaryEmail?.email || emails[0]?.email;
    }
  }

  return {
    id: userData.id.toString(),
    email: email || `${userData.login}@users.noreply.github.com`,
    name: userData.name || userData.login || null,
    image: userData.avatar_url || null,
  };
}

