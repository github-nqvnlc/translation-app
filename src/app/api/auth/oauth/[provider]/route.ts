import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/oauth/:provider
 * Initiate OAuth flow - redirect to provider
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;

    if (provider !== 'google' && provider !== 'github') {
      return NextResponse.json(
        { success: false, error: 'Provider không hợp lệ' },
        { status: 400 }
      );
    }

    // Get OAuth configuration from environment
    const clientId =
      provider === 'google'
        ? process.env.GOOGLE_CLIENT_ID
        : process.env.GITHUB_CLIENT_ID;

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'OAuth provider chưa được cấu hình' },
        { status: 500 }
      );
    }

    // Build OAuth authorization URL
    const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/oauth/${provider}/callback`;
    const state = crypto.randomUUID();
    const scope = provider === 'google' ? 'openid email profile' : 'user:email';

    let authUrl = '';
    if (provider === 'google') {
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope,
        state,
        access_type: 'offline',
        prompt: 'consent',
      }).toString()}`;
    } else {
      // GitHub
      authUrl = `https://github.com/login/oauth/authorize?${new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope,
        state,
      }).toString()}`;
    }

    // Store state in cookie for verification
    const response = NextResponse.redirect(authUrl);
    response.cookies.set(`oauth_state_${provider}`, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    });

    return response;
  } catch (error) {
    console.error('OAuth initiation error:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi khởi tạo OAuth' },
      { status: 500 }
    );
  }
}
