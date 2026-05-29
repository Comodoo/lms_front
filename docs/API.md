# AfriLearn LMS - API Documentation

This document describes the React Context APIs and hooks available in the AfriLearn LMS.

---

## Table of Contents

1. [Authentication API](#authentication-api)
2. [LMS Context API](#lms-context-api)
3. [Notifications API](#notifications-api)
4. [Theme API](#theme-api)
5. [Types Reference](#types-reference)

---

## Authentication API

### useAuth Hook

```typescript
import { useAuth } from '@/lib/auth-context';
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `user` | `AuthUser \| null` | Current authenticated user |
| `isAuthenticated` | `boolean` | Whether user is logged in |
| `isLoading` | `boolean` | Loading state during auth operations |

#### Methods

##### login

Authenticate a user with email and password.

```typescript
login(email: string, password: string): Promise<void>
```

**Example:**
```typescript
const { login } = useAuth();

try {
  await login('user@example.com', 'password123');
  router.push('/dashboard');
} catch (error) {
  console.error('Login failed:', error);
}
```

##### signup

Register a new user account.

```typescript
signup(data: SignupData): Promise<void>
```

**SignupData:**
```typescript
interface SignupData {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'instructor';
  acceptTerms: boolean;
}
```

**Example:**
```typescript
const { signup } = useAuth();

await signup({
  email: 'newuser@example.com',
  password: 'securepassword',
  name: 'John Doe',
  role: 'student',
  acceptTerms: true,
});
```

##### logout

Sign out the current user.

```typescript
logout(): void
```

##### resetPassword

Send password reset email.

```typescript
resetPassword(email: string): Promise<void>
```

##### updateProfile

Update user profile information.

```typescript
updateProfile(data: Partial<AuthUser>): void
```

##### enable2FA / verify2FA

Two-factor authentication methods.

```typescript
enable2FA(): Promise<string>  // Returns QR code data URL
verify2FA(code: string): Promise<boolean>
```

---

## LMS Context API

### useLMS Hook

```typescript
import { useLMS } from '@/lib/lms-context';
```

#### Data Properties

| Property | Type | Description |
|----------|------|-------------|
| `courses` | `Course[]` | All available courses |
| `enrollments` | `Enrollment[]` | User's enrollments |
| `currentUser` | `User \| null` | Current LMS user |
| `users` | `User[]` | All users (for instructors) |
| `reviews` | `Review[]` | Course reviews |
| `announcements` | `Announcement[]` | Course announcements |
| `institutionUsers` | `InstitutionUser[]` | Team members |
| `studentProfiles` | `StudentProfile[]` | Student profile data |

#### Course Methods

##### getCourseBySlug

Get a course by its URL slug.

```typescript
getCourseBySlug(slug: string): Course | undefined
```

**Example:**
```typescript
const { getCourseBySlug } = useLMS();
const course = getCourseBySlug('python-for-data-science');
```

##### getCourseById

Get a course by its ID.

```typescript
getCourseById(id: string): Course | undefined
```

##### getEnrolledCourses

Get all courses the current user is enrolled in.

```typescript
getEnrolledCourses(): Course[]
```

##### getRecommendedCourses

Get AI-recommended courses for the current user.

```typescript
getRecommendedCourses(): Course[]
```

#### Enrollment Methods

##### enrollInCourse

Enroll the current user in a course.

```typescript
enrollInCourse(courseId: string): void
```

**Example:**
```typescript
const { enrollInCourse } = useLMS();

const handleEnroll = () => {
  enrollInCourse(course.id);
  toast.success('Successfully enrolled!');
};
```

##### unenrollFromCourse

Remove enrollment from a course.

```typescript
unenrollFromCourse(courseId: string): void
```

##### getEnrollmentForCourse

Get enrollment data for a specific course.

```typescript
getEnrollmentForCourse(courseId: string): Enrollment | undefined
```

#### Progress Methods

##### updateLessonProgress

Update progress for a specific lesson.

```typescript
updateLessonProgress(
  courseId: string, 
  lessonId: string, 
  progress: LessonProgress
): void
```

**LessonProgress:**
```typescript
interface LessonProgress {
  lessonId: string;
  completed: boolean;
  watchedDuration?: number;
  quizScore?: number;
  completedAt?: Date;
}
```

##### completeLesson

Mark a lesson as completed.

```typescript
completeLesson(courseId: string, lessonId: string): void
```

##### getCourseProgress

Get detailed progress for a course.

```typescript
getCourseProgress(courseId: string): {
  overall: number;
  completedLessons: number;
  totalLessons: number;
  currentLesson: Lesson | null;
}
```

#### Assessment Methods

##### submitAssessment

Submit a quiz or exam attempt.

```typescript
submitAssessment(attempt: AssessmentAttempt): void
```

**AssessmentAttempt:**
```typescript
interface AssessmentAttempt {
  id: string;
  lessonId: string;
  courseId: string;
  userId: string;
  type: 'quiz' | 'exam' | 'practice';
  startedAt: Date;
  submittedAt?: Date;
  timeSpent: number;
  answers: AssessmentAnswer[];
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
}
```

##### getAssessmentHistory

Get all assessment attempts for a user.

```typescript
getAssessmentHistory(userId: string, courseId?: string): AssessmentAttempt[]
```

#### Instructor Methods

##### createCourse

Create a new course.

```typescript
createCourse(course: Course): void
```

##### updateCourse

Update an existing course.

```typescript
updateCourse(courseId: string, data: Partial<Course>): void
```

##### deleteCourse

Delete a course.

```typescript
deleteCourse(courseId: string): void
```

##### publishCourse

Publish a draft course.

```typescript
publishCourse(courseId: string): void
```

##### getStudentsForCourse

Get enrolled students for a course.

```typescript
getStudentsForCourse(courseId: string): StudentEnrollmentInfo[]
```

#### Review Methods

##### addReview

Add a new course review.

```typescript
addReview(review: Review): void
```

##### replyToReview

Add instructor reply to a review.

```typescript
replyToReview(reviewId: string, reply: string): void
```

##### getReviewsForCourse

Get all reviews for a course.

```typescript
getReviewsForCourse(courseId: string): Review[]
```

#### User Methods

##### switchUser

Switch the current user (for demo purposes).

```typescript
switchUser(userId: string): void
```

##### updateUserProfile

Update user profile data.

```typescript
updateUserProfile(data: Partial<User>): void
```

---

## Notifications API

### useNotifications Hook

```typescript
import { useNotifications } from '@/lib/notifications-context';
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `notifications` | `Notification[]` | All notifications |
| `unreadCount` | `number` | Count of unread notifications |

#### Methods

##### addNotification

Add a new notification.

```typescript
addNotification(notification: Omit<Notification, 'id' | 'createdAt'>): void
```

**Example:**
```typescript
const { addNotification } = useNotifications();

addNotification({
  type: 'achievement_unlocked',
  title: 'Badge Earned!',
  message: 'You earned the "Fast Learner" badge',
  isRead: false,
});
```

##### markAsRead

Mark a notification as read.

```typescript
markAsRead(id: string): void
```

##### markAllAsRead

Mark all notifications as read.

```typescript
markAllAsRead(): void
```

##### deleteNotification

Delete a notification.

```typescript
deleteNotification(id: string): void
```

##### clearAll

Clear all notifications.

```typescript
clearAll(): void
```

#### Notification Types

```typescript
type NotificationType = 
  | 'course_update'
  | 'new_lesson'
  | 'quiz_reminder'
  | 'assignment_due'
  | 'cohort_session'
  | 'certificate_earned'
  | 'badge_earned'
  | 'achievement_unlocked'
  | 'streak_reminder'
  | 'job_match'
  | 'application_update'
  | 'study_room_invite'
  | 'message_received'
  | 'payment_received'
  | 'subscription_renewal'
  | 'system_announcement';
```

---

## Theme API

### useTheme Hook

```typescript
import { useTheme } from '@/lib/theme-context';
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `theme` | `'light' \| 'dark' \| 'system'` | Current theme setting |
| `resolvedTheme` | `'light' \| 'dark'` | Actual applied theme |

#### Methods

##### setTheme

Set the theme.

```typescript
setTheme(theme: 'light' | 'dark' | 'system'): void
```

**Example:**
```typescript
const { theme, setTheme } = useTheme();

<button onClick={() => setTheme('dark')}>
  Dark Mode
</button>
```

---

## Types Reference

### User Types

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'instructor' | 'student';
  avatar?: string;
  createdAt: Date;
}

interface AuthUser extends User {
  phoneNumber?: string;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  lastLoginAt: Date;
}

interface StudentProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  headline: string;
  summary: string;
  skills: Skill[];
  education: Education[];
  workExperience: WorkExperience[];
  certifications: Certification[];
}
```

### Course Types

```typescript
interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  instructorId: string;
  instructorName: string;
  price: number;
  discountPrice?: number;
  status: 'draft' | 'published' | 'archived';
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  duration: number;
  totalLessons: number;
  totalStudents: number;
  rating: number;
  reviewsCount: number;
  requirements: string[];
  objectives: string[];
  tags: string[];
  sections: Section[];
  createdAt: Date;
  updatedAt: Date;
}

interface Section {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  sectionId: string;
  title: string;
  description: string;
  type: 'video' | 'document' | 'quiz' | 'assignment' | 'audio' | 'slideshow' | 'exam';
  content: LessonContent;
  duration: number;
  order: number;
  isFree: boolean;
  materials: Material[];
}
```

### Enrollment Types

```typescript
interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  completedLessons: string[];
  currentLessonId?: string;
  enrolledAt: Date;
  completedAt?: Date;
}
```

### Certificate Types

```typescript
interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  lessonId?: string;
  type: 'course_completion' | 'exam_pass' | 'achievement';
  title: string;
  issuedAt: Date;
  score?: number;
  verificationCode: string;
}

interface VerifiableCertificate extends Certificate {
  qrCodeUrl: string;
  publicUrl: string;
  blockchainHash?: string;
  skillsValidated: string[];
  grade?: 'pass' | 'merit' | 'distinction' | 'honors';
}
```

### Payment Types

```typescript
type MobileMoneyProvider = 
  | 'mpesa' 
  | 'airtel_money' 
  | 'tigo_pesa' 
  | 'mtn_momo' 
  | 'orange_money';

interface MobilePayment {
  id: string;
  userId: string;
  provider: MobileMoneyProvider;
  phoneNumber: string;
  amount: number;
  currency: 'TSH' | 'TZS' | 'UGX' | 'GHS' | 'NGN' | 'ZAR';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  transactionId?: string;
  reference: string;
  courseId?: string;
  initiatedAt: Date;
  completedAt?: Date;
}
```

### Subscription Types

```typescript
type SubscriptionTier = 'free' | 'basic' | 'pro' | 'career_track';

interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: 'active' | 'cancelled' | 'past_due' | 'expired';
  pricePerMonth: number;
  pricePerYear: number;
  billingCycle: 'monthly' | 'yearly';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  features: SubscriptionFeature[];
}
```

### Skill Types

```typescript
interface SkillScore {
  id: string;
  userId: string;
  skillId: string;
  skillName: string;
  score: number;
  level: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  xpPoints: number;
  endorsements: SkillEndorsement[];
  verifiedByEmployer: boolean;
}

interface SkillBadge {
  id: string;
  skillId: string;
  skillName: string;
  badgeType: 'bronze' | 'silver' | 'gold' | 'platinum' | 'mastery';
  title: string;
  description: string;
  requirements: {
    minScore: number;
    minAssessments?: number;
  };
  earnedAt?: Date;
  verificationCode?: string;
}
```

### Cohort Types

```typescript
interface Cohort {
  id: string;
  courseId: string;
  name: string;
  description: string;
  instructorId: string;
  startDate: Date;
  endDate: Date;
  enrollmentDeadline: Date;
  schedule: CohortSchedule[];
  price: number;
  maxStudents: number;
  currentStudents: number;
  status: 'upcoming' | 'enrolling' | 'in_progress' | 'completed';
}

interface LiveSession {
  id: string;
  cohortId: string;
  title: string;
  scheduledAt: Date;
  duration: number;
  meetingUrl: string;
  recordingUrl?: string;
  status: 'scheduled' | 'live' | 'ended';
}
```

---

## Error Handling

All async methods may throw errors. Use try-catch:

```typescript
const { login } = useAuth();

const handleLogin = async () => {
  try {
    await login(email, password);
    router.push('/dashboard');
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.code) {
        case 'INVALID_CREDENTIALS':
          toast.error('Invalid email or password');
          break;
        case 'USER_NOT_FOUND':
          toast.error('No account found with this email');
          break;
        case 'ACCOUNT_LOCKED':
          toast.error('Account locked. Please reset password.');
          break;
        default:
          toast.error('Login failed. Please try again.');
      }
    }
  }
};
```

---

## Best Practices

### 1. Always Check Loading States

```typescript
const { isLoading, courses } = useLMS();

if (isLoading) {
  return <Skeleton />;
}
```

### 2. Use Memoization for Derived Data

```typescript
const enrolledCourses = useMemo(() => {
  return courses.filter(c => 
    enrollments.some(e => e.courseId === c.id)
  );
}, [courses, enrollments]);
```

### 3. Handle Edge Cases

```typescript
const course = getCourseBySlug(slug);

if (!course) {
  notFound(); // Next.js 404
}
```

### 4. Type Your Props

```typescript
interface CourseCardProps {
  course: Course;
  onEnroll?: (courseId: string) => void;
  showProgress?: boolean;
}
```

