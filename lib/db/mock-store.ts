// Mock Data Store - In-memory database simulation
// This can be replaced with real database calls (Supabase, Neon, etc.)

import type {
  DBUser, DBCourse, DBSection, DBLesson, DBEnrollment,
  DBPayment, DBCertificate, DBReview, DBConversation, DBMessage,
  DBNotification, DBQuiz, DBQuizQuestion, DBLessonProgress
} from './schema';

// Generate unique IDs
export const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Hash password (simplified - use bcrypt in production)
export const hashPassword = (password: string) => {
  return Buffer.from(password).toString('base64');
};

export const verifyPassword = (password: string, hash: string) => {
  return hashPassword(password) === hash;
};

// Mock Users
const users: Map<string, DBUser> = new Map([
  ['user-student-1', {
    id: 'user-student-1',
    email: 'student@example.com',
    passwordHash: hashPassword('password123'),
    name: 'John Mwangi',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    role: 'student',
    status: 'active',
    emailVerified: true,
    phone: '+254712345678',
    country: 'KE',
    timezone: 'Africa/Nairobi',
    preferredLanguage: 'en',
    bio: 'Aspiring software developer from Nairobi',
    headline: 'Software Development Student',
    twoFactorEnabled: false,
    notificationPreferences: { email: true, push: true, sms: false },
    subscriptionTier: 'pro',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
    lastLoginAt: new Date(),
  }],
  ['user-instructor-1', {
    id: 'user-instructor-1',
    email: 'instructor@example.com',
    passwordHash: hashPassword('password123'),
    name: 'Dr. Amina Osei',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amina',
    role: 'instructor',
    status: 'active',
    emailVerified: true,
    phone: '+233241234567',
    country: 'GH',
    timezone: 'Africa/Accra',
    preferredLanguage: 'en',
    bio: 'Data Science expert with 10+ years of experience. Passionate about teaching and empowering African youth.',
    headline: 'Senior Data Scientist & Educator',
    website: 'https://aminaosei.com',
    linkedIn: 'https://linkedin.com/in/aminaosei',
    twoFactorEnabled: true,
    twoFactorSecret: 'JBSWY3DPEHPK3PXP',
    notificationPreferences: { email: true, push: true, sms: true },
    subscriptionTier: 'pro',
    subscriptionStatus: 'active',
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date(),
    lastLoginAt: new Date(),
  }],
  ['user-admin-1', {
    id: 'user-admin-1',
    email: 'admin@example.com',
    passwordHash: hashPassword('admin123'),
    name: 'Admin User',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    role: 'admin',
    status: 'active',
    emailVerified: true,
    country: 'KE',
    timezone: 'Africa/Nairobi',
    preferredLanguage: 'en',
    twoFactorEnabled: true,
    twoFactorSecret: 'JBSWY3DPEHPK3PXP',
    notificationPreferences: { email: true, push: true, sms: true },
    subscriptionTier: 'career_track',
    subscriptionStatus: 'active',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date(),
    lastLoginAt: new Date(),
  }],
]);

// Mock Courses
const courses: Map<string, DBCourse> = new Map([
  ['course-python-ds', {
    id: 'course-python-ds',
    slug: 'python-for-data-science',
    title: 'Python for Data Science',
    description: 'Master Python programming for data analysis, visualization, and machine learning. This comprehensive course covers everything from Python basics to advanced data science techniques used by top tech companies.',
    shortDescription: 'Learn Python for data science with hands-on projects',
    instructorId: 'user-instructor-1',
    thumbnail: '/courses/python-ds.jpg',
    previewVideoUrl: 'https://sample-videos.com/preview.mp4',
    category: 'Data Science',
    subcategory: 'Python',
    tags: ['python', 'data-science', 'machine-learning', 'pandas', 'numpy'],
    language: 'en',
    subtitles: ['en', 'sw', 'fr'],
    price: 4999,
    currency: 'TSH',
    discountPrice: 2999,
    discountExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    level: 'beginner',
    status: 'published',
    isPublic: true,
    isFeatured: true,
    isPremium: true,
    prerequisites: ['Basic computer skills', 'No programming experience needed'],
    targetAudience: ['Aspiring data scientists', 'Business analysts', 'Students'],
    learningOutcomes: [
      'Write Python code confidently',
      'Analyze data using Pandas and NumPy',
      'Create visualizations with Matplotlib and Seaborn',
      'Build machine learning models with Scikit-learn',
    ],
    totalStudents: 2547,
    totalRatings: 892,
    averageRating: 4.7,
    totalRevenue: 7564150,
    completionRate: 68,
    totalDurationMinutes: 1840,
    totalLessons: 156,
    totalSections: 12,
    createdAt: new Date('2023-08-15'),
    updatedAt: new Date(),
    publishedAt: new Date('2023-09-01'),
  }],
  ['course-web-dev', {
    id: 'course-web-dev',
    slug: 'fullstack-web-development',
    title: 'Full-Stack Web Development Bootcamp',
    description: 'Become a full-stack developer with this comprehensive bootcamp covering HTML, CSS, JavaScript, React, Node.js, and databases.',
    shortDescription: 'Complete web development from zero to hero',
    instructorId: 'user-instructor-1',
    thumbnail: '/courses/web-dev.jpg',
    category: 'Web Development',
    subcategory: 'Full-Stack',
    tags: ['web', 'javascript', 'react', 'nodejs', 'html', 'css'],
    language: 'en',
    subtitles: ['en', 'fr'],
    price: 7999,
    currency: 'TSH',
    level: 'beginner',
    status: 'published',
    isPublic: true,
    isFeatured: true,
    isPremium: true,
    prerequisites: ['Basic computer skills'],
    targetAudience: ['Career changers', 'Students', 'Entrepreneurs'],
    learningOutcomes: [
      'Build responsive websites from scratch',
      'Create dynamic web applications with React',
      'Build RESTful APIs with Node.js',
      'Deploy applications to the cloud',
    ],
    totalStudents: 3821,
    totalRatings: 1456,
    averageRating: 4.8,
    totalRevenue: 15284000,
    completionRate: 72,
    totalDurationMinutes: 3200,
    totalLessons: 245,
    totalSections: 18,
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date(),
    publishedAt: new Date('2023-07-01'),
  }],
]);

// Mock Sections
const sections: Map<string, DBSection> = new Map([
  ['section-1', {
    id: 'section-1',
    courseId: 'course-python-ds',
    title: 'Getting Started with Python',
    description: 'Learn the basics of Python programming',
    orderIndex: 0,
    isPublished: true,
    createdAt: new Date('2023-08-15'),
    updatedAt: new Date(),
  }],
  ['section-2', {
    id: 'section-2',
    courseId: 'course-python-ds',
    title: 'Data Manipulation with Pandas',
    description: 'Master data manipulation techniques',
    orderIndex: 1,
    isPublished: true,
    createdAt: new Date('2023-08-15'),
    updatedAt: new Date(),
  }],
]);

// Mock Lessons
const lessons: Map<string, DBLesson> = new Map([
  ['lesson-1', {
    id: 'lesson-1',
    sectionId: 'section-1',
    courseId: 'course-python-ds',
    title: 'Introduction to Python',
    description: 'Get started with Python programming',
    type: 'video',
    orderIndex: 0,
    videoUrl: 'https://sample-videos.com/lesson1.mp4',
    videoDurationSeconds: 720,
    attachments: [],
    isPreview: true,
    isPublished: true,
    createdAt: new Date('2023-08-15'),
    updatedAt: new Date(),
  }],
  ['lesson-2', {
    id: 'lesson-2',
    sectionId: 'section-1',
    courseId: 'course-python-ds',
    title: 'Variables and Data Types',
    description: 'Learn about Python variables and data types',
    type: 'video',
    orderIndex: 1,
    videoUrl: 'https://sample-videos.com/lesson2.mp4',
    videoDurationSeconds: 900,
    attachments: [
      { name: 'variables-cheatsheet.pdf', url: '/downloads/variables.pdf', size: 245000 }
    ],
    isPreview: false,
    isPublished: true,
    createdAt: new Date('2023-08-15'),
    updatedAt: new Date(),
  }],
]);

// Mock Enrollments
const enrollments: Map<string, DBEnrollment> = new Map([
  ['enrollment-1', {
    id: 'enrollment-1',
    userId: 'user-student-1',
    courseId: 'course-python-ds',
    status: 'active',
    progressPercent: 35,
    completedLessons: ['lesson-1', 'lesson-2'],
    lastAccessedLessonId: 'lesson-2',
    lastAccessedAt: new Date(),
    paymentId: 'payment-1',
    paidAmount: 2999,
    currency: 'TSH',
    paymentMethod: 'mpesa',
    enrolledAt: new Date('2024-01-20'),
  }],
]);

// Mock Payments
const payments: Map<string, DBPayment> = new Map([
  ['payment-1', {
    id: 'payment-1',
    userId: 'user-student-1',
    type: 'course',
    referenceId: 'course-python-ds',
    amount: 2999,
    currency: 'TSH',
    platformFee: 450,
    instructorPayout: 2549,
    method: 'mpesa',
    providerTransactionId: 'MPE123456789',
    status: 'completed',
    billingName: 'John Mwangi',
    billingEmail: 'student@example.com',
    billingCountry: 'KE',
    createdAt: new Date('2024-01-20'),
    completedAt: new Date('2024-01-20'),
  }],
]);

// Mock Certificates
const certificates: Map<string, DBCertificate> = new Map();

// Mock Reviews
const reviews: Map<string, DBReview> = new Map([
  ['review-1', {
    id: 'review-1',
    userId: 'user-student-1',
    courseId: 'course-python-ds',
    enrollmentId: 'enrollment-1',
    rating: 5,
    title: 'Excellent course for beginners!',
    content: 'This course helped me understand Python from scratch. The instructor explains concepts clearly with practical examples.',
    status: 'approved',
    helpfulCount: 24,
    reportCount: 0,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date(),
  }],
]);

// Mock Conversations
const conversations: Map<string, DBConversation> = new Map([
  ['conv-1', {
    id: 'conv-1',
    type: 'direct',
    participantIds: ['user-student-1', 'user-instructor-1'],
    isPinned: false,
    isMuted: false,
    isArchived: false,
    unreadCounts: { 'user-student-1': 0, 'user-instructor-1': 1 },
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date(),
    lastMessageAt: new Date(),
  }],
]);

// Mock Messages
const messages: Map<string, DBMessage> = new Map([
  ['msg-1', {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-student-1',
    type: 'text',
    content: 'Hello! I have a question about the Pandas section.',
    status: 'read',
    readBy: [{ participantId: 'user-instructor-1', readAt: new Date() }],
    isEdited: false,
    isDeleted: false,
    createdAt: new Date('2024-02-01T10:00:00'),
  }],
  ['msg-2', {
    id: 'msg-2',
    conversationId: 'conv-1',
    senderId: 'user-instructor-1',
    type: 'text',
    content: 'Of course! What would you like to know?',
    status: 'delivered',
    readBy: [],
    isEdited: false,
    isDeleted: false,
    createdAt: new Date('2024-02-01T10:05:00'),
  }],
]);

// Mock Notifications
const notifications: Map<string, DBNotification> = new Map([
  ['notif-1', {
    id: 'notif-1',
    userId: 'user-student-1',
    type: 'course_update',
    title: 'New lesson available',
    message: 'A new lesson has been added to Python for Data Science',
    data: { courseId: 'course-python-ds', lessonId: 'lesson-3' },
    actionUrl: '/learn/python-for-data-science',
    isRead: false,
    createdAt: new Date(),
  }],
]);

// Mock Lesson Progress
const lessonProgress: Map<string, DBLessonProgress> = new Map();

// Database Operations - These would be replaced with actual database queries

// Users
export const db = {
  users: {
    findById: (id: string) => users.get(id) || null,
    findByEmail: (email: string) => Array.from(users.values()).find(u => u.email === email) || null,
    findAll: () => Array.from(users.values()),
    findByRole: (role: DBUser['role']) => Array.from(users.values()).filter(u => u.role === role),
    create: (user: DBUser) => { users.set(user.id, user); return user; },
    update: (id: string, data: Partial<DBUser>) => {
      const user = users.get(id);
      if (!user) return null;
      const updated = { ...user, ...data, updatedAt: new Date() };
      users.set(id, updated);
      return updated;
    },
    delete: (id: string) => users.delete(id),
    count: () => users.size,
  },
  
  courses: {
    findById: (id: string) => courses.get(id) || null,
    findBySlug: (slug: string) => Array.from(courses.values()).find(c => c.slug === slug) || null,
    findAll: () => Array.from(courses.values()),
    findPublished: () => Array.from(courses.values()).filter(c => c.status === 'published'),
    findByInstructor: (instructorId: string) => Array.from(courses.values()).filter(c => c.instructorId === instructorId),
    findByCategory: (category: string) => Array.from(courses.values()).filter(c => c.category === category),
    findFeatured: () => Array.from(courses.values()).filter(c => c.isFeatured && c.status === 'published'),
    create: (course: DBCourse) => { courses.set(course.id, course); return course; },
    update: (id: string, data: Partial<DBCourse>) => {
      const course = courses.get(id);
      if (!course) return null;
      const updated = { ...course, ...data, updatedAt: new Date() };
      courses.set(id, updated);
      return updated;
    },
    delete: (id: string) => courses.delete(id),
    count: () => courses.size,
  },
  
  sections: {
    findById: (id: string) => sections.get(id) || null,
    findByCourse: (courseId: string) => Array.from(sections.values()).filter(s => s.courseId === courseId).sort((a, b) => a.orderIndex - b.orderIndex),
    create: (section: DBSection) => { sections.set(section.id, section); return section; },
    update: (id: string, data: Partial<DBSection>) => {
      const section = sections.get(id);
      if (!section) return null;
      const updated = { ...section, ...data, updatedAt: new Date() };
      sections.set(id, updated);
      return updated;
    },
    delete: (id: string) => sections.delete(id),
  },
  
  lessons: {
    findById: (id: string) => lessons.get(id) || null,
    findBySection: (sectionId: string) => Array.from(lessons.values()).filter(l => l.sectionId === sectionId).sort((a, b) => a.orderIndex - b.orderIndex),
    findByCourse: (courseId: string) => Array.from(lessons.values()).filter(l => l.courseId === courseId),
    create: (lesson: DBLesson) => { lessons.set(lesson.id, lesson); return lesson; },
    update: (id: string, data: Partial<DBLesson>) => {
      const lesson = lessons.get(id);
      if (!lesson) return null;
      const updated = { ...lesson, ...data, updatedAt: new Date() };
      lessons.set(id, updated);
      return updated;
    },
    delete: (id: string) => lessons.delete(id),
  },
  
  enrollments: {
    findById: (id: string) => enrollments.get(id) || null,
    findByUser: (userId: string) => Array.from(enrollments.values()).filter(e => e.userId === userId),
    findByCourse: (courseId: string) => Array.from(enrollments.values()).filter(e => e.courseId === courseId),
    findByUserAndCourse: (userId: string, courseId: string) => Array.from(enrollments.values()).find(e => e.userId === userId && e.courseId === courseId) || null,
    create: (enrollment: DBEnrollment) => { enrollments.set(enrollment.id, enrollment); return enrollment; },
    update: (id: string, data: Partial<DBEnrollment>) => {
      const enrollment = enrollments.get(id);
      if (!enrollment) return null;
      const updated = { ...enrollment, ...data };
      enrollments.set(id, updated);
      return updated;
    },
    delete: (id: string) => enrollments.delete(id),
    count: () => enrollments.size,
  },
  
  payments: {
    findById: (id: string) => payments.get(id) || null,
    findByUser: (userId: string) => Array.from(payments.values()).filter(p => p.userId === userId),
    findAll: () => Array.from(payments.values()),
    create: (payment: DBPayment) => { payments.set(payment.id, payment); return payment; },
    update: (id: string, data: Partial<DBPayment>) => {
      const payment = payments.get(id);
      if (!payment) return null;
      const updated = { ...payment, ...data };
      payments.set(id, updated);
      return updated;
    },
  },
  
  certificates: {
    findById: (id: string) => certificates.get(id) || null,
    findByCode: (code: string) => Array.from(certificates.values()).find(c => c.verificationCode === code) || null,
    findByUser: (userId: string) => Array.from(certificates.values()).filter(c => c.userId === userId),
    create: (cert: DBCertificate) => { certificates.set(cert.id, cert); return cert; },
    update: (id: string, data: Partial<DBCertificate>) => {
      const cert = certificates.get(id);
      if (!cert) return null;
      const updated = { ...cert, ...data };
      certificates.set(id, updated);
      return updated;
    },
  },
  
  reviews: {
    findById: (id: string) => reviews.get(id) || null,
    findByCourse: (courseId: string) => Array.from(reviews.values()).filter(r => r.courseId === courseId && r.status === 'approved'),
    findByUser: (userId: string) => Array.from(reviews.values()).filter(r => r.userId === userId),
    create: (review: DBReview) => { reviews.set(review.id, review); return review; },
    update: (id: string, data: Partial<DBReview>) => {
      const review = reviews.get(id);
      if (!review) return null;
      const updated = { ...review, ...data, updatedAt: new Date() };
      reviews.set(id, updated);
      return updated;
    },
    delete: (id: string) => reviews.delete(id),
  },
  
  conversations: {
    findById: (id: string) => conversations.get(id) || null,
    findByParticipant: (userId: string) => Array.from(conversations.values()).filter(c => c.participantIds.includes(userId)),
    create: (conv: DBConversation) => { conversations.set(conv.id, conv); return conv; },
    update: (id: string, data: Partial<DBConversation>) => {
      const conv = conversations.get(id);
      if (!conv) return null;
      const updated = { ...conv, ...data, updatedAt: new Date() };
      conversations.set(id, updated);
      return updated;
    },
    delete: (id: string) => conversations.delete(id),
  },
  
  messages: {
    findById: (id: string) => messages.get(id) || null,
    findByConversation: (conversationId: string) => Array.from(messages.values()).filter(m => m.conversationId === conversationId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    create: (msg: DBMessage) => { messages.set(msg.id, msg); return msg; },
    update: (id: string, data: Partial<DBMessage>) => {
      const msg = messages.get(id);
      if (!msg) return null;
      const updated = { ...msg, ...data };
      messages.set(id, updated);
      return updated;
    },
    delete: (id: string) => {
      const msg = messages.get(id);
      if (msg) {
        messages.set(id, { ...msg, isDeleted: true, deletedAt: new Date() });
      }
    },
  },
  
  notifications: {
    findById: (id: string) => notifications.get(id) || null,
    findByUser: (userId: string) => Array.from(notifications.values()).filter(n => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    findUnreadByUser: (userId: string) => Array.from(notifications.values()).filter(n => n.userId === userId && !n.isRead),
    create: (notif: DBNotification) => { notifications.set(notif.id, notif); return notif; },
    markAsRead: (id: string) => {
      const notif = notifications.get(id);
      if (notif) {
        notifications.set(id, { ...notif, isRead: true, readAt: new Date() });
      }
    },
    markAllAsRead: (userId: string) => {
      Array.from(notifications.values())
        .filter(n => n.userId === userId && !n.isRead)
        .forEach(n => notifications.set(n.id, { ...n, isRead: true, readAt: new Date() }));
    },
    delete: (id: string) => notifications.delete(id),
  },
  
  lessonProgress: {
    findByEnrollmentAndLesson: (enrollmentId: string, lessonId: string) => 
      Array.from(lessonProgress.values()).find(p => p.enrollmentId === enrollmentId && p.lessonId === lessonId) || null,
    findByEnrollment: (enrollmentId: string) => Array.from(lessonProgress.values()).filter(p => p.enrollmentId === enrollmentId),
    create: (progress: DBLessonProgress) => { lessonProgress.set(progress.id, progress); return progress; },
    update: (id: string, data: Partial<DBLessonProgress>) => {
      const progress = lessonProgress.get(id);
      if (!progress) return null;
      const updated = { ...progress, ...data };
      lessonProgress.set(id, updated);
      return updated;
    },
  },
};

export default db;

