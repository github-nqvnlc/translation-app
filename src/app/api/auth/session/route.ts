import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session-token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Không có session' },
        { status: 401 }
      );
    }

    // Find session in database
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          include: {
            systemRole: true,
            projectMemberships: {
              include: {
                project: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session không tồn tại' },
        { status: 401 }
      );
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      // Delete expired session
      await prisma.session.delete({
        where: { id: session.id },
      });

      return NextResponse.json(
        { success: false, error: 'Session đã hết hạn' },
        { status: 401 }
      );
    }

    const user = session.user;

    // Get user roles
    const roles: string[] = [];
    if (user.systemRole) {
      roles.push(user.systemRole.role);
    }

    // Get project roles
    const projectRoles = user.projectMemberships.map((membership) => ({
      projectId: membership.project.id,
      projectName: membership.project.name,
      role: membership.role,
    }));

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          emailVerified: user.emailVerified,
          systemRole: user.systemRole?.role || null,
          projectRoles,
        },
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
          createdAt: session.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi lấy thông tin session' },
      { status: 500 }
    );
  }
}

