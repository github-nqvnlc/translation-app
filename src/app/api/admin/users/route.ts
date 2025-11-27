import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthAndSystemRole } from '@/lib/middleware/rbac';
import { Role } from '@prisma/client';

/**
 * GET /api/admin/users
 * Lấy danh sách tất cả users (chỉ system ADMIN)
 * - Hỗ trợ pagination: page, limit
 * - Hỗ trợ filtering: search (email, name), emailVerified
 * - Hỗ trợ sorting: sortBy (createdAt, email), sortOrder (asc/desc)
 */
export async function GET(request: NextRequest) {
  try {
    // Check auth and system admin permission
    const { user, error } = await requireAuthAndSystemRole(Role.ADMIN);
    if (error) {
      return error;
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const emailVerified = searchParams.get('emailVerified');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100); // Max 100 per page
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: {
      email?: { contains: string; mode: 'insensitive' };
      name?: { contains: string; mode: 'insensitive' };
      emailVerified?: boolean;
      OR?: Array<{
        email?: { contains: string; mode: 'insensitive' };
        name?: { contains: string; mode: 'insensitive' };
      }>;
    } = {};

    // Search filter
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Email verified filter
    if (emailVerified !== null && emailVerified !== '') {
      where.emailVerified = emailVerified === 'true';
    }

    // Validate sortBy
    const validSortFields = ['createdAt', 'email', 'name'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    // Validate sortOrder
    const validSortOrders = ['asc', 'desc'];
    const sortDirection = validSortOrders.includes(sortOrder.toLowerCase())
      ? sortOrder.toLowerCase()
      : 'desc';

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await prisma.user.count({ where });

    // Get users
    const users = await prisma.user.findMany({
      where,
      include: {
        systemRole: true,
        _count: {
          select: {
            projectMemberships: true,
            sessions: true,
          },
        },
      },
      orderBy: {
        [sortField]: sortDirection,
      },
      skip,
      take: limit,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
        lastLoginIp: user.lastLoginIp,
        systemRole: user.systemRole?.role || null,
        projectCount: user._count.projectMemberships,
        activeSessionCount: user._count.sessions,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      filters: {
        search: search || null,
        emailVerified: emailVerified || null,
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi lấy danh sách users' },
      { status: 500 }
    );
  }
}

