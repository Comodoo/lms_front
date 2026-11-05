import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/mock-store';
import { getUserFromSession } from '../../../auth/session/route';

// GET /api/admin/users/[userId] - Get user details (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = getUserFromSession(request);

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { userId } = await params;
    const user = db.users.findById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's enrollments
    const enrollments = db.enrollments.findByUser(userId);

    // Get user's payments
    const payments = db.payments.findByUser(userId);

    // Get user's certificates
    const certificates = db.certificates.findByUser(userId);

    // If instructor, get their courses
    let courses: any[] = [];
    if (user.role === 'instructor') {
      courses = db.courses.findByInstructor(userId);
    }

    const { passwordHash: _, ...safeUser } = user;

    return NextResponse.json({
      user: safeUser,
      enrollments,
      payments,
      certificates,
      courses,
      stats: {
        totalEnrollments: enrollments.length,
        completedCourses: enrollments.filter(e => e.status === 'completed').length,
        totalSpent: payments.reduce((sum, p) => sum + p.amount, 0),
        certificatesEarned: certificates.length,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users/[userId] - Update user (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = getUserFromSession(request);

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { userId } = await params;
    const user = db.users.findById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Admin can update these fields
    const allowedFields = [
      'name', 'email', 'role', 'status', 'emailVerified',
      'subscriptionTier', 'subscriptionStatus', 'subscriptionExpiresAt',
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const updatedUser = db.users.update(userId, updates);
    const { passwordHash: _, ...safeUser } = updatedUser!;

    return NextResponse.json({
      success: true,
      user: safeUser,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[userId] - Delete user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = getUserFromSession(request);

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { userId } = await params;
    
    // Prevent self-deletion
    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const user = db.users.findById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check for active enrollments
    const enrollments = db.enrollments.findByUser(userId);
    if (enrollments.some(e => e.status === 'active')) {
      return NextResponse.json(
        { error: 'Cannot delete user with active enrollments' },
        { status: 400 }
      );
    }

    db.users.delete(userId);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
