import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { requireSystemRole } from '@/lib/middleware/rbac';
import { Role } from '@prisma/client';
import { sendVerificationEmail, sendResetPasswordEmail } from '@/lib/email';

import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Check admin permission
    const authResult = await requireAuth();
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { success: false, message: 'Chưa đăng nhập' },
        { status: 401 }
      );
    }

    const rbacResult = requireSystemRole(authResult.user!, Role.ADMIN);
    if (!rbacResult.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: rbacResult.error || 'Không có quyền Admin',
        },
        { status: rbacResult.statusCode || 403 }
      );
    }

    const body = await request.json();
    const { email, type } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Thiếu email' },
        { status: 400 }
      );
    }

    // Generate a test token
    const testToken = `test_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    console.log(`\n📧 [TEST EMAIL] Sending ${type} email to: ${email}`);
    console.log(`   Token: ${testToken}`);

    let result;
    if (type === 'verification') {
      result = await sendVerificationEmail(email, testToken);
    } else if (type === 'password-reset') {
            result = await sendResetPasswordEmail(email, testToken);
    } else {
      return NextResponse.json(
        { success: false, message: 'Loại email không hợp lệ' },
        { status: 400 }
      );
    }

    if (result.success) {
      // Log to audit
      await prisma.auditLog.create({
        data: {
          userId: authResult.user!.id,
          action: 'TEST_EMAIL_SENT',
          resourceType: 'email',
          resourceId: email,
          details: { type, testToken: testToken.slice(0, 20) + '...' },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });

      console.log(`   ✅ Email sent successfully!`);
      return NextResponse.json({
        success: true,
        message: `Email ${type} đã được gửi đến ${email}`,
      });
    } else {
      console.log(`   ❌ Email failed: ${result.error}`);
      return NextResponse.json(
        { success: false, message: `Gửi email thất bại: ${result.error}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server khi gửi email' },
      { status: 500 }
    );
  }
}

