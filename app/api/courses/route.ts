import { NextRequest, NextResponse } from 'next/server';
import { db, generateId } from '@/lib/db/mock-store';
import { getUserFromSession } from '../auth/session/route';
import type { DBCourse } from '@/lib/db/schema';

// GET /api/courses - List all published courses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    let courses = db.courses.findPublished();

    // Filter by category
    if (category) {
      courses = courses.filter(c => c.category.toLowerCase() === category.toLowerCase());
    }

    // Filter by level
    if (level) {
      courses = courses.filter(c => c.level === level);
    }

    // Filter by featured
    if (featured) {
      courses = courses.filter(c => c.isFeatured);
    }

    // Search
    if (search) {
      const searchLower = search.toLowerCase();
      courses = courses.filter(c =>
        c.title.toLowerCase().includes(searchLower) ||
        c.description.toLowerCase().includes(searchLower) ||
        c.tags.some(t => t.toLowerCase().includes(searchLower))
      );
    }

    // Pagination
    const total = courses.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    courses = courses.slice(offset, offset + limit);

    // Get instructor info for each course
    const coursesWithInstructor = courses.map(course => {
      const instructor = db.users.findById(course.instructorId);
      return {
        ...course,
        instructor: instructor ? {
          id: instructor.id,
          name: instructor.name,
          avatar: instructor.avatar,
          headline: instructor.headline,
        } : null,
      };
    });

    return NextResponse.json({
      courses: coursesWithInstructor,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Get courses error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create a new course (instructor only)
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromSession(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (user.role !== 'instructor' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only instructors can create courses' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      shortDescription,
      category,
      subcategory,
      level,
      price,
      currency = 'TSH',
      tags = [],
      prerequisites = [],
      targetAudience = [],
      learningOutcomes = [],
      language = 'en',
    } = body;

    // Validation
    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'Title, description, and category are required' },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug exists
    const existingCourse = db.courses.findBySlug(slug);
    const uniqueSlug = existingCourse ? `${slug}-${Date.now()}` : slug;

    const courseId = generateId();
    const newCourse: DBCourse = {
      id: courseId,
      slug: uniqueSlug,
      title,
      description,
      shortDescription: shortDescription || description.substring(0, 200),
      instructorId: user.id,
      thumbnail: '/courses/default-thumbnail.jpg',
      category,
      subcategory,
      tags,
      language,
      subtitles: [language],
      price: price || 0,
      currency,
      level: level || 'beginner',
      status: 'draft',
      isPublic: false,
      isFeatured: false,
      isPremium: price > 0,
      prerequisites,
      targetAudience,
      learningOutcomes,
      totalStudents: 0,
      totalRatings: 0,
      averageRating: 0,
      totalRevenue: 0,
      completionRate: 0,
      totalDurationMinutes: 0,
      totalLessons: 0,
      totalSections: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const course = db.courses.create(newCourse);

    return NextResponse.json({
      success: true,
      course,
      message: 'Course created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create course error:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}

