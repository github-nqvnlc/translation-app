import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, createAuthErrorResponse } from '@/lib/middleware/auth';
import { Role } from '@prisma/client';

/**
 * GET /api/audit-logs
 * Lấy danh sách audit logs
 * - System ADMIN: Thấy tất cả logs
 * - User thường: Chỉ thấy logs của chính họ
 * - Hỗ trợ filtering: userId, resourceType, action, startDate, endDate
 * - Hỗ trợ pagination: page, limit
 * - Hỗ trợ sorting: sortBy (createdAt), sortOrder (asc/desc)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authenticated || !authResult.user) {
      return createAuthErrorResponse(authResult);
    }

    const user = authResult.user;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const resourceType = searchParams.get('resourceType');
    const action = searchParams.get('action');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100); // Max 100 per page
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: {
      userId?: string;
      resourceType?: string;
      action?: string;
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    // If not system admin, only show own logs
    if (user.systemRole !== Role.ADMIN) {
      where.userId = user.id;
    } else {
      // System admin can filter by userId
      if (userId) {
        where.userId = userId;
      }
    }

    // Filter by resourceType
    if (resourceType) {
      where.resourceType = resourceType;
    }

    // Filter by action
    if (action) {
      where.action = action;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Validate sortBy
    const validSortFields = ['createdAt', 'action', 'resourceType'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    // Validate sortOrder
    const validSortOrders = ['asc', 'desc'];
    const sortDirection = validSortOrders.includes(sortOrder.toLowerCase()) 
      ? sortOrder.toLowerCase() 
      : 'desc';

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await prisma.auditLog.count({ where });

    // Get audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
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
      data: auditLogs.map((log) => ({
        id: log.id,
        userId: log.userId,
        user: log.user,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        details: log.details,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
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
        userId: userId || (user.systemRole !== Role.ADMIN ? user.id : null),
        resourceType: resourceType || null,
        action: action || null,
        startDate: startDate || null,
        endDate: endDate || null,
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi lấy audit logs' },
      { status: 500 }
    );
  }
}

