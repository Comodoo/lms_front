// Course and LMS Types

export type CourseStatus = 'draft' | 'published' | 'archived';
export type LessonType = 'video' | 'document' | 'quiz' | 'assignment' | 'audio' | 'slideshow' | 'exam';
export type MaterialType = 'pdf' | 'video' | 'link' | 'file' | 'audio' | 'zip' | 'image';
export type EnrollmentStatus = 'active' | 'completed' | 'paused';
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'matching';
export type AssessmentType = 'quiz' | 'exam' | 'practice';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'instructor' | 'student' | 'admin' | 'accountant';
  avatar?: string;
  createdAt: Date;
}

export interface Course {
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
  status: CourseStatus;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  duration: number; // in minutes
  totalLessons: number;
  totalStudents: number;
  rating: number;
  reviewsCount: number;
  requirements: string[];
  objectives: string[];
  tags: string[];
  sections: Section[];
  /** Team member IDs assigned to co-manage this course */
  assignedUserIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Section {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  sectionId: string;
  title: string;
  description: string;
  type: LessonType;
  content: LessonContent;
  duration: number; // in minutes
  order: number;
  isFree: boolean;
  materials: Material[];
}

export interface LessonContent {
  // Video content
  videoUrl?: string;
  videoProvider?: 'youtube' | 'vimeo' | 'custom';

  // Document content
  documentContent?: string;
  documentUrl?: string;

  // Audio content
  audioUrl?: string;
  audioTitle?: string;
  audioTranscript?: string;

  // Slideshow content
  slides?: Slide[];
  autoPlay?: boolean;
  slideDuration?: number; // seconds per slide

  // Quiz/Exam content
  quizQuestions?: QuizQuestion[];
  assessmentConfig?: AssessmentConfig;

  // Assignment content
  assignmentDescription?: string;
  assignmentDueDate?: Date;
  assignmentRubric?: AssignmentRubric[];
}

export interface Slide {
  id: string;
  imageUrl: string;
  title?: string;
  description?: string;
  order: number;
}

export interface AssessmentConfig {
  type: AssessmentType;
  title: string;
  description?: string;
  timeLimit?: number; // in minutes, 0 = no limit
  passingScore: number; // percentage
  maxAttempts: number; // 0 = unlimited
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResults: 'immediately' | 'after_submission' | 'after_deadline';
  allowReview: boolean;
  certificateOnPass: boolean;
}

export interface AssignmentRubric {
  id: string;
  criterion: string;
  description: string;
  maxPoints: number;
}

export interface Material {
  id: string;
  lessonId: string;
  title: string;
  type: MaterialType;
  url: string;
  fileSize?: number;
  downloadable: boolean;
  // For ZIP files
  zipContents?: ZipFileEntry[];
  extractedAt?: Date;
  // For images
  thumbnailUrl?: string;
  dimensions?: { width: number; height: number };
}

export interface ZipFileEntry {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  size: number;
  mimeType?: string;
  content?: string; // for text-based files that can be viewed
  previewUrl?: string; // for images
  children?: ZipFileEntry[]; // for folders
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options: string[];
  correctAnswer: number | number[] | string; // number for single, array for multiple, string for short answer
  points: number;
  explanation?: string;
  imageUrl?: string;
  matchingPairs?: { left: string; right: string }[]; // for matching questions
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: EnrollmentStatus;
  progress: number;
  completedLessons: string[];
  currentLessonId?: string;
  enrolledAt: Date;
  completedAt?: Date;
}

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  watchedDuration?: number;
  quizScore?: number;
  completedAt?: Date;
}

export interface AssessmentAttempt {
  id: string;
  lessonId: string;
  courseId: string;
  userId: string;
  type: AssessmentType;
  startedAt: Date;
  submittedAt?: Date;
  timeSpent: number; // in seconds
  answers: AssessmentAnswer[];
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  certificateEarned: boolean;
  certificateId?: string;
}

export interface AssessmentAnswer {
  questionId: string;
  answer: number | number[] | string;
  isCorrect: boolean;
  pointsEarned: number;
  timeSpent?: number; // seconds spent on this question
}

export interface StudentPerformance {
  userId: string;
  courseId: string;
  overallProgress: number;
  totalTimeSpent: number; // in minutes
  lessonsCompleted: number;
  totalLessons: number;
  quizzesTaken: number;
  quizzesTotal: number;
  averageQuizScore: number;
  examsTaken: number;
  examsTotal: number;
  averageExamScore: number;
  strongTopics: string[];
  weakTopics: string[];
  lastActivity: Date;
  streak: number; // days
  certificatesEarned: Certificate[];
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  lessonId?: string; // if for specific exam
  type: 'course_completion' | 'exam_pass' | 'achievement';
  title: string;
  issuedAt: Date;
  score?: number;
  verificationCode: string;
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  courseId: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  instructorReply?: string;
  repliedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
}

export interface StudentEnrollmentInfo {
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  courseId: string;
  courseTitle: string;
  enrolledAt: Date;
  progress: number;
  status: EnrollmentStatus;
  completedLessons: number;
  totalLessons: number;
  lastActivity?: Date;
}

export interface Note {
  id: string;
  userId: string;
  lessonId: string;
  content: string;
  timestamp?: number; // for video notes
  createdAt: Date;
}

export interface CourseFormData {
  title: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  price: number;
  discountPrice?: number;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  requirements: string[];
  objectives: string[];
  tags: string[];
}

export interface SectionFormData {
  title: string;
  description: string;
}

export interface LessonFormData {
  title: string;
  description: string;
  type: LessonType;
  content: LessonContent;
  duration: number;
  isFree: boolean;
}

export const CATEGORIES = [
  'Development',
  'Business',
  'Finance & Accounting',
  'IT & Software',
  'Design',
  'Marketing',
  'Lifestyle',
  'Photography & Video',
  'Health & Fitness',
  'Music',
  'Teaching & Academics',
];

export const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Portuguese',
  'Japanese',
  'Chinese',
  'Korean',
  'Arabic',
  'Hindi',
];

// Student Profile and Resume Types
export interface StudentProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  headline: string;
  summary: string;
  location: string;
  website?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;

  // Career Information
  careerGoals: string[];
  currentRole?: string;
  yearsOfExperience: number;
  employmentStatus: 'employed' | 'unemployed' | 'student' | 'freelancer' | 'seeking';
  desiredRoles: string[];
  desiredSalary?: {
    min: number;
    max: number;
    currency: string;
  };
  remotePreference: 'remote' | 'hybrid' | 'onsite' | 'any';
  willingToRelocate: boolean;

  // Skills and Interests
  skills: Skill[];
  interests: string[];
  preferredCategories: string[];
  learningGoals: string[];

  // Education and Certifications
  education: Education[];
  certifications: Certification[];

  // Work Experience
  workExperience: WorkExperience[];

  // Projects
  projects: Project[];

  // Resume Data
  resumeUrl?: string;
  resumeLastUpdated?: Date;

  // Onboarding
  onboardingCompleted: boolean;
  onboardingStep: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface Skill {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
  endorsements?: number;
  category: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  grade?: string;
  description?: string;
  location?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
  credentialUrl?: string;
  skills: string[];
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  location?: string;
  locationType: 'remote' | 'hybrid' | 'onsite';
  startDate: Date;
  endDate?: Date;
  current: boolean;
  description: string;
  achievements: string[];
  skills: string[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  url?: string;
  githubUrl?: string;
  imageUrl?: string;
  technologies: string[];
  startDate?: Date;
  endDate?: Date;
  featured: boolean;
}

// Course Pool and Recommendations
export interface CourseRecommendation {
  courseId: string;
  score: number;
  reasons: string[];
  matchedSkills: string[];
  matchedGoals: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  targetRole: string;
  courses: string[];
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  skills: string[];
}

export const SKILL_CATEGORIES = [
  'Programming Languages',
  'Web Development',
  'Mobile Development',
  'Database',
  'Cloud & DevOps',
  'Data Science',
  'Machine Learning',
  'Design',
  'Marketing',
  'Business',
  'Project Management',
  'Communication',
  'Leadership',
  'Analytics',
  'Other',
];

export const CAREER_GOALS = [
  'Get a new job',
  'Get a promotion',
  'Start freelancing',
  'Start a business',
  'Career change',
  'Learn new skills',
  'Stay current in field',
  'Personal development',
  'Academic requirements',
  'Hobby / Interest',
];

export const JOB_ROLES = [
  'Software Developer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Mobile Developer',
  'DevOps Engineer',
  'Data Scientist',
  'Data Analyst',
  'Machine Learning Engineer',
  'Product Manager',
  'Project Manager',
  'UX Designer',
  'UI Designer',
  'Graphic Designer',
  'Digital Marketer',
  'Content Writer',
  'Business Analyst',
  'Quality Assurance',
  'System Administrator',
  'Database Administrator',
  'Security Engineer',
  'Cloud Architect',
  'Technical Writer',
  'Scrum Master',
  'Other',
];

// B2B Enterprise Types
export type OrganizationType = 'university' | 'business' | 'government' | 'nonprofit';
export type EnterpriseRole = 'customer' | 'content_provider' | 'both';
export type KYBStatus = 'pending' | 'in_review' | 'verified' | 'rejected';
export type EnterpriseStatus = 'pending' | 'active' | 'suspended' | 'inactive';

export interface EnterpriseOrganization {
  id: string;
  name: string;
  type: OrganizationType;
  country: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  website?: string;
  logo?: string;
  description?: string;
  industry?: string;
  employeeCount?: string;

  // KYB Information
  registrationNumber: string;
  taxId: string;
  documents: EnterpriseDocument[];
  kybStatus: KYBStatus;
  kybSubmittedAt?: Date;
  kybVerifiedAt?: Date;
  kybNotes?: string;

  // Contact Information
  primaryContact: EnterpriseContact;
  billingContact?: EnterpriseContact;
  technicalContact?: EnterpriseContact;

  // Role and Permissions
  role: EnterpriseRole;

  // Subscription and Billing
  subscription?: EnterpriseSubscription;

  // Settings
  settings: EnterpriseSettings;

  status: EnterpriseStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnterpriseContact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
}

export interface EnterpriseDocument {
  id: string;
  name: string;
  type: 'registration' | 'tax' | 'identity' | 'address' | 'other';
  url: string;
  uploadedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
}

export interface EnterpriseSubscription {
  id: string;
  plan: 'starter' | 'professional' | 'enterprise';
  seats: number;
  usedSeats: number;
  pricePerSeat: number;
  billingCycle: 'monthly' | 'annual';
  startDate: Date;
  endDate: Date;
  status: 'active' | 'past_due' | 'cancelled';
}

export interface EnterpriseSettings {
  allowSelfEnrollment: boolean;
  requireApproval: boolean;
  ssoEnabled: boolean;
  ssoProvider?: string;
  customBranding: boolean;
  brandColor?: string;
  customDomain?: string;
  allowedEmailDomains: string[];
}

export interface EnterpriseEnrollmentForm {
  // Step 1: Organization Details
  orgName: string;
  type: OrganizationType;
  country: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  website: string;
  industry: string;
  employeeCount: string;
  description: string;

  // Step 2: KYB Verification
  registrationNumber: string;
  taxId: string;
  documents: File[];

  // Step 3: Contact Information
  primaryContact: EnterpriseContact;

  // Step 4: Role Selection
  role: EnterpriseRole;

  // Step 5: Plan Selection
  plan: 'starter' | 'professional' | 'enterprise';
  seats: number;
  billingCycle: 'monthly' | 'annual';
}

export const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'India',
  'Brazil',
  'Japan',
  'Singapore',
  'Netherlands',
  'Sweden',
  'Switzerland',
  'South Korea',
  'Other',
];

export const INDUSTRIES = [
  'Technology',
  'Education',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Media & Entertainment',
  'Government',
  'Non-profit',
  'Professional Services',
  'Other',
];

export const EMPLOYEE_COUNTS = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5000+',
];

// ─── Institution Team / User Management Types ────────────────────────────────

export type InstitutionUserRole =
  | 'admin'
  | 'co_instructor'
  | 'course_manager'
  | 'teaching_assistant'
  | 'content_editor'
  | 'analyst';

export type InstitutionUserStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export interface UserPermission {
  key: string;
  label: string;
  description: string;
  category: 'courses' | 'students' | 'analytics' | 'settings' | 'team';
}

export interface InstitutionUser {
  id: string;
  /** The owning institution/instructor account id */
  institutionId: string;
  name: string;
  email: string;
  avatar?: string;
  role: InstitutionUserRole;
  status: InstitutionUserStatus;
  permissions: string[];           // permission keys
  /** IDs of courses this user is assigned to manage */
  assignedCourseIds: string[];
  department?: string;
  jobTitle?: string;
  phone?: string;
  bio?: string;
  joinedAt: Date;
  lastActiveAt?: Date;
  invitedBy: string;               // institutionId
  createdAt: Date;
  updatedAt: Date;
}

export const ROLE_PRESETS: Record<InstitutionUserRole, {
  label: string;
  description: string;
  color: string;
  defaultPermissions: string[];
}> = {
  admin: {
    label: 'Admin',
    description: 'Full access — can manage users, courses and settings',
    color: 'bg-purple-100 text-purple-700',
    defaultPermissions: [
      'courses.create', 'courses.edit', 'courses.delete', 'courses.publish',
      'students.view', 'students.manage', 'students.message',
      'analytics.view', 'analytics.export',
      'settings.edit',
      'team.manage',
    ],
  },
  co_instructor: {
    label: 'Co-Instructor',
    description: 'Can create and manage assigned courses',
    color: 'bg-blue-100 text-blue-700',
    defaultPermissions: [
      'courses.create', 'courses.edit', 'courses.publish',
      'students.view', 'students.message',
      'analytics.view',
    ],
  },
  course_manager: {
    label: 'Course Manager',
    description: 'Manages course content and enrollments',
    color: 'bg-cyan-100 text-cyan-700',
    defaultPermissions: [
      'courses.edit',
      'students.view', 'students.manage',
      'analytics.view',
    ],
  },
  teaching_assistant: {
    label: 'Teaching Assistant',
    description: 'Supports students and reviews submissions',
    color: 'bg-green-100 text-green-700',
    defaultPermissions: [
      'courses.edit',
      'students.view', 'students.message',
    ],
  },
  content_editor: {
    label: 'Content Editor',
    description: 'Creates and edits course content only',
    color: 'bg-amber-100 text-amber-700',
    defaultPermissions: [
      'courses.create', 'courses.edit',
    ],
  },
  analyst: {
    label: 'Analyst',
    description: 'View-only access to analytics and reports',
    color: 'bg-slate-100 text-slate-700',
    defaultPermissions: [
      'analytics.view', 'analytics.export',
      'students.view',
    ],
  },
};

export const ALL_PERMISSIONS: UserPermission[] = [
  // Courses
  { key: 'courses.create', label: 'Create Courses', description: 'Create new courses', category: 'courses' },
  { key: 'courses.edit', label: 'Edit Courses', description: 'Edit course content', category: 'courses' },
  { key: 'courses.delete', label: 'Delete Courses', description: 'Delete courses permanently', category: 'courses' },
  { key: 'courses.publish', label: 'Publish Courses', description: 'Publish / unpublish courses', category: 'courses' },
  // Students
  { key: 'students.view', label: 'View Students', description: 'View student lists', category: 'students' },
  { key: 'students.manage', label: 'Manage Students', description: 'Enroll / remove students', category: 'students' },
  { key: 'students.message', label: 'Message Students', description: 'Send messages to students', category: 'students' },
  // Analytics
  { key: 'analytics.view', label: 'View Analytics', description: 'View reports & dashboards', category: 'analytics' },
  { key: 'analytics.export', label: 'Export Data', description: 'Export analytics data', category: 'analytics' },
  // Settings
  { key: 'settings.edit', label: 'Edit Settings', description: 'Change institution settings', category: 'settings' },
  // Team
  { key: 'team.manage', label: 'Manage Team', description: 'Invite, edit & remove users', category: 'team' },
];

// ─── End Institution Types ────────────────────────────────────────────────────

// Instructor Business Profile Types
export type InstructorKYBStatus = 'not_started' | 'pending' | 'in_review' | 'verified' | 'rejected' | 'expired';
export type PayoutMethod = 'bank_transfer' | 'paypal' | 'stripe' | 'wise';
export type InstructorTier = 'starter' | 'professional' | 'expert' | 'enterprise';

export interface InstructorProfile {
  id: string;
  userId: string;

  // Personal Information
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone?: string;
  avatar?: string;
  coverImage?: string;

  // Professional Profile
  headline: string;
  bio: string;
  expertise: string[];
  languages: string[];
  website?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;

  // Business Information (KYB)
  businessType: 'individual' | 'company';
  businessName?: string;
  businessRegistrationNumber?: string;
  taxId?: string;
  vatNumber?: string;
  country: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;

  // KYB Documents
  kybDocuments: InstructorDocument[];
  kybStatus: InstructorKYBStatus;
  kybSubmittedAt?: Date;
  kybVerifiedAt?: Date;
  kybExpiresAt?: Date;
  kybRejectionReason?: string;

  // Payment Information
  payoutMethod: PayoutMethod;
  payoutDetails: PayoutDetails;
  taxFormSubmitted: boolean;
  taxFormType?: 'W9' | 'W8BEN' | 'W8BENE';

  // Instructor Stats
  tier: InstructorTier;
  totalStudents: number;
  totalCourses: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;

  // Revenue Share
  revenueShare: number; // percentage (e.g., 70 for 70%)

  // Settings
  settings: InstructorSettings;

  // Verification
  emailVerified: boolean;
  phoneVerified: boolean;
  identityVerified: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface InstructorDocument {
  id: string;
  name: string;
  type: 'identity' | 'business_registration' | 'tax' | 'address_proof' | 'bank_statement' | 'other';
  url: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: Date;
  reviewNotes?: string;
}

export interface PayoutDetails {
  // Bank Transfer
  bankName?: string;
  bankAccountNumber?: string;
  bankRoutingNumber?: string;
  bankSwiftCode?: string;
  bankIban?: string;

  // PayPal
  paypalEmail?: string;

  // Stripe
  stripeAccountId?: string;

  // Wise
  wiseEmail?: string;
  wiseCurrency?: string;
}

export interface InstructorSettings {
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  studentMessages: boolean;
  reviewAlerts: boolean;
  salesReports: 'daily' | 'weekly' | 'monthly' | 'never';

  // Privacy
  showRealName: boolean;
  showEmail: boolean;
  showSocialLinks: boolean;
  allowDirectMessages: boolean;

  // Course Defaults
  defaultLanguage: string;
  defaultCurrency: string;
  autoPublish: boolean;

  // Advanced
  apiAccess: boolean;
  webhookUrl?: string;
  twoFactorEnabled: boolean;
}

export interface InstructorAnalytics {
  // Overview
  totalRevenue: number;
  revenueThisMonth: number;
  revenueTrend: number; // percentage change

  totalStudents: number;
  newStudentsThisMonth: number;
  studentsTrend: number;

  totalEnrollments: number;
  enrollmentsThisMonth: number;
  enrollmentsTrend: number;

  averageRating: number;
  ratingTrend: number;

  // Course Performance
  coursePerformance: CourseAnalytics[];

  // Revenue Breakdown
  revenueByMonth: { month: string; revenue: number; enrollments: number }[];
  revenueByCountry: { country: string; revenue: number; percentage: number }[];
  revenueBySource: { source: string; revenue: number; percentage: number }[];

  // Student Demographics
  studentsByCountry: { country: string; count: number; percentage: number }[];
  studentsByDevice: { device: string; count: number; percentage: number }[];

  // Engagement
  averageCompletionRate: number;
  averageWatchTime: number; // minutes
  topPerformingLessons: { lessonId: string; title: string; completionRate: number }[];

  // Traffic Sources
  trafficSources: { source: string; visits: number; conversions: number; revenue: number }[];
}

export interface CourseAnalytics {
  courseId: string;
  courseTitle: string;
  thumbnail: string;
  totalStudents: number;
  newStudentsThisMonth: number;
  revenue: number;
  revenueThisMonth: number;
  rating: number;
  reviewsCount: number;
  completionRate: number;
  refundRate: number;
}

// File Upload Types
export interface UploadedFile {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  processingStatus: 'uploading' | 'processing' | 'ready' | 'failed';
  metadata?: FileMetadata;
}

export interface FileMetadata {
  // Video
  duration?: number;
  resolution?: string;
  codec?: string;

  // Audio
  bitrate?: number;
  channels?: number;

  // Image
  width?: number;
  height?: number;

  // Document
  pages?: number;
}

export const INSTRUCTOR_TIERS = {
  starter: {
    name: 'Starter',
    revenueShare: 50,
    maxCourses: 5,
    maxStudentsPerCourse: 100,
    features: ['Basic analytics', 'Email support', 'Standard payouts'],
  },
  professional: {
    name: 'Professional',
    revenueShare: 70,
    maxCourses: 20,
    maxStudentsPerCourse: 1000,
    features: ['Advanced analytics', 'Priority support', 'Faster payouts', 'Custom branding'],
  },
  expert: {
    name: 'Expert',
    revenueShare: 80,
    maxCourses: 50,
    maxStudentsPerCourse: 5000,
    features: ['Full analytics', 'Dedicated support', 'Weekly payouts', 'API access', 'Co-instructor'],
  },
  enterprise: {
    name: 'Enterprise',
    revenueShare: 85,
    maxCourses: -1, // unlimited
    maxStudentsPerCourse: -1,
    features: ['Enterprise analytics', '24/7 support', 'Daily payouts', 'Full API', 'White-label', 'Custom contracts'],
  },
};

// ─── Cart & Checkout Types ────────────────────────────────────────────────────

export interface CartItem {
  courseId: string;
  addedAt: Date;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  courseIds?: string[]; // If empty, applies to all
  usageLimit?: number;
  usedCount: number;
  expiresAt?: Date;
  createdAt: Date;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponId?: string;
  couponCode?: string;
  total: number;
  paymentMethod: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: Date;
  completedAt?: Date;
}

export interface OrderItem {
  courseId: string;
  courseTitle: string;
  price: number;
  discountPrice?: number;
}

// ─── Q&A Discussion Types ─────────────────────────────────────────────────────

export interface Question {
  id: string;
  courseId: string;
  lessonId?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  content: string;
  upvotes: number;
  upvotedBy: string[];
  answerCount: number;
  isResolved: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Answer {
  id: string;
  questionId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  isInstructor: boolean;
  content: string;
  upvotes: number;
  upvotedBy: string[];
  isAccepted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Announcements & Reminders Types ──────────────────────────────────────────

export interface Announcement {
  id: string;
  courseId: string;
  instructorId: string;
  instructorName: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high';
  isRead: boolean;
  readBy: string[];
  createdAt: Date;
}

export interface LearningReminder {
  id: string;
  userId: string;
  courseId?: string;
  type: 'daily' | 'weekly' | 'custom';
  days: number[]; // 0-6 for Sunday-Saturday
  time: string; // HH:MM format
  enabled: boolean;
  lastSent?: Date;
  createdAt: Date;
}

// ─── Course Recommendation Types ──────────────────────────────────────────────

export interface CourseRecommendationData {
  courseId: string;
  score: number;
  reason: 'similar_topic' | 'same_instructor' | 'popular_with_students' | 'trending' | 'new_release' | 'based_on_history';
  relatedCourseId?: string;
}

// ─── Sample Coupons ───────────────────────────────────────────────────────────

export const SAMPLE_COUPONS: Coupon[] = [
  {
    id: 'coupon-1',
    code: 'WELCOME20',
    discountType: 'percentage',
    discountValue: 20,
    usedCount: 0,
    createdAt: new Date(),
  },
  {
    id: 'coupon-2',
    code: 'SAVE10',
    discountType: 'fixed',
    discountValue: 10,
    minPurchase: 30,
    usedCount: 0,
    createdAt: new Date(),
  },
  {
    id: 'coupon-3',
    code: 'FLASH50',
    discountType: 'percentage',
    discountValue: 50,
    maxDiscount: 100,
    usageLimit: 100,
    usedCount: 45,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
  },
];

// ─── AI Learning Assistant Types ──────────────────────────────────────────────

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  context?: AIMessageContext;
  suggestions?: string[];
  isLoading?: boolean;
}

export interface AIMessageContext {
  courseId?: string;
  lessonId?: string;
  topicName?: string;
  sectionName?: string;
}

export interface AIConversation {
  id: string;
  userId: string;
  courseId?: string;
  lessonId?: string;
  messages: AIMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface AIGeneratedQuiz {
  id: string;
  topicName: string;
  questions: AIQuizQuestion[];
  generatedAt: Date;
}

export interface AILectureSummary {
  id: string;
  lessonId: string;
  keyPoints: string[];
  summary: string;
  concepts: { term: string; definition: string }[];
  generatedAt: Date;
}

// ─── Skill-Based Progression Types ────────────────────────────────────────────

export interface SkillScore {
  id: string;
  userId: string;
  skillId: string;
  skillName: string;
  score: number; // 0-100
  level: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  xpPoints: number;
  assessmentsTaken: number;
  lastAssessmentDate?: Date;
  verifiedByEmployer: boolean;
  endorsements: SkillEndorsement[];
  history: SkillScoreHistory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillEndorsement {
  id: string;
  endorserId: string;
  endorserName: string;
  endorserRole: string;
  endorserAvatar?: string;
  comment?: string;
  endorsedAt: Date;
}

export interface SkillScoreHistory {
  score: number;
  source: 'quiz' | 'exam' | 'project' | 'peer_review' | 'instructor_assessment';
  sourceId: string;
  timestamp: Date;
}

export interface SkillBadge {
  id: string;
  skillId: string;
  skillName: string;
  badgeType: 'bronze' | 'silver' | 'gold' | 'platinum' | 'mastery';
  title: string;
  description: string;
  iconUrl: string;
  requirements: {
    minScore: number;
    minAssessments?: number;
    minEndorsements?: number;
  };
  earnedAt?: Date;
  verificationCode?: string;
  isPublic: boolean;
}

export interface TopicMastery {
  id: string;
  userId: string;
  courseId: string;
  topicId: string;
  topicName: string;
  masteryLevel: number; // 0-100
  lessonsCompleted: number;
  totalLessons: number;
  quizzesPassed: number;
  totalQuizzes: number;
  timeSpent: number; // minutes
  lastActivity: Date;
}

export interface SkillTree {
  id: string;
  categoryName: string;
  skills: SkillTreeNode[];
}

export interface SkillTreeNode {
  id: string;
  skillName: string;
  skillId: string;
  level: number;
  prerequisites: string[]; // skill IDs
  unlocked: boolean;
  completed: boolean;
  xpRequired: number;
  children: string[]; // skill IDs
}

// ─── Career Pipeline Types ────────────────────────────────────────────────────

export interface JobPosting {
  id: string;
  employerId: string;
  employerName: string;
  employerLogo?: string;
  title: string;
  description: string;
  requirements: string[];
  preferredSkills: string[];
  requiredSkillScores: { skillId: string; minScore: number }[];
  location: string;
  locationType: 'remote' | 'hybrid' | 'onsite';
  salaryRange?: { min: number; max: number; currency: string };
  employmentType: 'full_time' | 'part_time' | 'contract' | 'internship';
  linkedCourseIds: string[];
  applicationDeadline?: Date;
  applicantCount: number;
  status: 'open' | 'closed' | 'paused';
  createdAt: Date;
  updatedAt: Date;
}

export interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  coverLetter?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  skillScores: { skillId: string; score: number }[];
  completedCourses: string[];
  matchScore: number; // 0-100 based on skill alignment
  status: 'pending' | 'reviewing' | 'shortlisted' | 'interview' | 'offered' | 'hired' | 'rejected';
  notes?: string;
  appliedAt: Date;
  updatedAt: Date;
}

export interface EmployerDashboard {
  employerId: string;
  companyName: string;
  logo?: string;
  description: string;
  industry: string;
  size: string;
  website?: string;

  // Metrics
  totalJobPostings: number;
  activeJobPostings: number;
  totalApplicants: number;
  totalHires: number;

  // Course partnerships
  partnerCourseIds: string[];
  talentPoolAccess: boolean;

  // Settings
  verificationStatus: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
}

export interface TalentPoolMember {
  userId: string;
  userName: string;
  userAvatar?: string;
  headline: string;
  skills: { skillId: string; skillName: string; score: number }[];
  completedCourses: { courseId: string; courseTitle: string; grade?: number }[];
  certifications: string[];
  availability: 'immediate' | '2_weeks' | '1_month' | 'not_looking';
  preferredRoles: string[];
  preferredLocations: string[];
  remotePreference: 'remote' | 'hybrid' | 'onsite' | 'any';
  matchScore?: number;
}

export interface InternshipPipeline {
  id: string;
  courseId: string;
  courseName: string;
  employerId: string;
  employerName: string;
  positions: number;
  duration: string; // e.g., "3 months"
  stipend?: { amount: number; currency: string };
  requirements: string[];
  applicationDeadline: Date;
  startDate: Date;
  status: 'upcoming' | 'accepting' | 'closed' | 'in_progress' | 'completed';
  applicants: string[];
  selectedCandidates: string[];
}

// ─── Cohort-Based Learning Types ──────────────────────────────────────────────

export interface Cohort {
  id: string;
  courseId: string;
  courseName: string;
  name: string;
  description: string;
  instructorId: string;
  instructorName: string;

  // Schedule
  startDate: Date;
  endDate: Date;
  enrollmentDeadline: Date;
  schedule: CohortSchedule[];

  // Pricing
  price: number;
  currency: string;
  maxStudents: number;
  currentStudents: number;

  // Features
  hasLiveSessions: boolean;
  hasGroupAssignments: boolean;
  hasPeerReview: boolean;
  hasMentor: boolean;

  // Status
  status: 'upcoming' | 'enrolling' | 'in_progress' | 'completed';

  createdAt: Date;
  updatedAt: Date;
}

export interface CohortSchedule {
  id: string;
  cohortId: string;
  type: 'live_session' | 'assignment_due' | 'quiz_due' | 'group_project' | 'milestone';
  title: string;
  description?: string;
  scheduledAt: Date;
  duration?: number; // minutes for live sessions
  lessonId?: string;
  meetingUrl?: string;
  isCompleted: boolean;
}

export interface CohortMember {
  id: string;
  cohortId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  role: 'student' | 'mentor' | 'ta';
  joinedAt: Date;
  progress: number;
  attendance: AttendanceRecord[];
  groupId?: string;
}

export interface AttendanceRecord {
  sessionId: string;
  attended: boolean;
  joinedAt?: Date;
  leftAt?: Date;
  duration?: number;
}

export interface CohortGroup {
  id: string;
  cohortId: string;
  name: string;
  members: string[];
  leaderId?: string;
  assignments: GroupAssignment[];
}

export interface GroupAssignment {
  id: string;
  cohortId: string;
  groupId: string;
  title: string;
  description: string;
  dueDate: Date;
  submissionUrl?: string;
  grade?: number;
  feedback?: string;
  status: 'pending' | 'submitted' | 'graded';
}

export interface CohortLeaderboard {
  cohortId: string;
  entries: {
    userId: string;
    userName: string;
    userAvatar?: string;
    rank: number;
    xpPoints: number;
    lessonsCompleted: number;
    quizScore: number;
    attendance: number;
    streak: number;
  }[];
  lastUpdated: Date;
}

export interface LiveSession {
  id: string;
  cohortId: string;
  title: string;
  description?: string;
  hostId: string;
  hostName: string;
  scheduledAt: Date;
  duration: number;
  meetingUrl: string;
  recordingUrl?: string;
  status: 'scheduled' | 'live' | 'ended';
  attendees: string[];
  resources: { name: string; url: string }[];
}

// ─── Social Learning Types ────────────────────────────────────────────────────

export interface StudyRoom {
  id: string;
  name: string;
  description: string;
  courseId?: string;
  courseName?: string;
  creatorId: string;
  creatorName: string;
  type: 'public' | 'private' | 'course_only';
  maxMembers: number;
  members: StudyRoomMember[];
  channels: StudyRoomChannel[];
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
}

export interface StudyRoomMember {
  userId: string;
  userName: string;
  userAvatar?: string;
  role: 'owner' | 'moderator' | 'member';
  joinedAt: Date;
  isOnline: boolean;
  lastSeen: Date;
}

export interface StudyRoomChannel {
  id: string;
  roomId: string;
  name: string;
  type: 'text' | 'voice' | 'video' | 'resources';
  description?: string;
  messages: StudyRoomMessage[];
  isPrivate: boolean;
}

export interface StudyRoomMessage {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  type: 'text' | 'file' | 'code' | 'link' | 'poll';
  attachments?: { name: string; url: string; type: string }[];
  reactions: { emoji: string; userIds: string[] }[];
  replyTo?: string;
  isPinned: boolean;
  createdAt: Date;
  editedAt?: Date;
}

export interface AccountabilityGroup {
  id: string;
  name: string;
  description: string;
  courseId?: string;
  members: AccountabilityMember[];
  goals: AccountabilityGoal[];
  checkIns: AccountabilityCheckIn[];
  streak: number;
  createdAt: Date;
}

export interface AccountabilityMember {
  userId: string;
  userName: string;
  userAvatar?: string;
  role: 'leader' | 'member';
  weeklyGoalHours: number;
  currentWeekHours: number;
  streak: number;
  joinedAt: Date;
}

export interface AccountabilityGoal {
  id: string;
  groupId: string;
  userId: string;
  title: string;
  description?: string;
  targetDate: Date;
  status: 'in_progress' | 'completed' | 'missed';
  progress: number;
}

export interface AccountabilityCheckIn {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  content: string;
  hoursLogged: number;
  mood: 'great' | 'good' | 'okay' | 'struggling';
  achievements: string[];
  blockers: string[];
  createdAt: Date;
}

// ─── Gamification Types ───────────────────────────────────────────────────────

export interface GamificationProfile {
  userId: string;
  level: number;
  currentXP: number;
  totalXP: number;
  xpToNextLevel: number;
  rank: string;
  badges: UserBadge[];
  achievements: Achievement[];
  streakDays: number;
  longestStreak: number;
  lastActivityDate: Date;
  weeklyXP: number;
  monthlyXP: number;
  globalRank?: number;
}

export interface UserBadge {
  badgeId: string;
  earnedAt: Date;
  isNew: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconUrl: string;
  category: 'learning' | 'social' | 'skill' | 'streak' | 'special';
  xpReward: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

export interface XPTransaction {
  id: string;
  userId: string;
  amount: number;
  source: 'lesson_complete' | 'quiz_pass' | 'course_complete' | 'daily_login' | 'streak_bonus' | 'achievement' | 'peer_help' | 'challenge';
  sourceId?: string;
  description: string;
  timestamp: Date;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  requirements: { action: string; target: number; current?: number }[];
  xpReward: number;
  badgeReward?: string;
  startDate: Date;
  endDate: Date;
  participants: string[];
  completedBy: string[];
}

// ─── Practical Labs & Simulations Types ───────────────────────────────────────

export interface CodeLab {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  language: 'javascript' | 'typescript' | 'python' | 'html' | 'css' | 'sql' | 'java' | 'go' | 'rust';
  difficulty: 'beginner' | 'intermediate' | 'advanced';

  // Code content
  starterCode: string;
  solutionCode: string;
  testCases: CodeTestCase[];

  // Instructions
  instructions: string;
  hints: string[];

  // Completion
  passingScore: number;
  maxAttempts: number;
  timeLimit?: number;

  createdAt: Date;
}

export interface CodeTestCase {
  id: string;
  name: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  points: number;
}

export interface CodeSubmission {
  id: string;
  labId: string;
  userId: string;
  code: string;
  language: string;
  testResults: { testId: string; passed: boolean; output: string; error?: string }[];
  score: number;
  passed: boolean;
  executionTime: number;
  submittedAt: Date;
}

export interface BusinessSimulation {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  scenario: string;
  category: 'marketing' | 'finance' | 'operations' | 'strategy' | 'hr';

  // Simulation data
  initialState: Record<string, unknown>;
  decisions: SimulationDecision[];
  outcomes: SimulationOutcome[];

  // Scoring
  metrics: { name: string; weight: number; target: number }[];

  duration: number; // in simulated time periods
  createdAt: Date;
}

export interface SimulationDecision {
  id: string;
  period: number;
  title: string;
  description: string;
  options: {
    id: string;
    label: string;
    description: string;
    effects: Record<string, number>;
  }[];
}

export interface SimulationOutcome {
  period: number;
  metrics: Record<string, number>;
  feedback: string;
}

export interface SimulationAttempt {
  id: string;
  simulationId: string;
  userId: string;
  decisions: { decisionId: string; chosenOptionId: string; period: number }[];
  finalMetrics: Record<string, number>;
  score: number;
  feedback: string;
  completedAt: Date;
}

export interface CaseStudy {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  company: string;
  industry: string;

  // Content
  background: string;
  challenge: string;
  data: CaseStudyData[];
  questions: CaseStudyQuestion[];

  // Resources
  attachments: { name: string; url: string; type: string }[];

  createdAt: Date;
}

export interface CaseStudyData {
  id: string;
  label: string;
  type: 'table' | 'chart' | 'text' | 'image';
  content: unknown;
}

export interface CaseStudyQuestion {
  id: string;
  question: string;
  type: 'essay' | 'multiple_choice' | 'analysis';
  rubric?: { criterion: string; maxPoints: number }[];
  sampleAnswer?: string;
}

export interface CaseStudySubmission {
  id: string;
  caseStudyId: string;
  userId: string;
  answers: { questionId: string; answer: string }[];
  grade?: number;
  feedback?: string;
  submittedAt: Date;
  gradedAt?: Date;
}

// ─── Certification 2.0 Types ──────────────────────────────────────────────────

export interface VerifiableCertificate {
  id: string;
  userId: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  instructorId: string;
  instructorName: string;

  // Certificate details
  type: 'completion' | 'skill_mastery' | 'professional' | 'achievement';
  title: string;
  description: string;
  skillsValidated: string[];
  score?: number;
  grade?: 'pass' | 'merit' | 'distinction' | 'honors';

  // Verification
  verificationCode: string;
  qrCodeUrl: string;
  publicUrl: string;
  blockchainHash?: string;
  blockchainNetwork?: string;

  // Metadata
  issueDate: Date;
  expiryDate?: Date;
  isRevoked: boolean;
  revokedAt?: Date;
  revokedReason?: string;

  // Sharing
  isPublic: boolean;
  linkedInUrl?: string;
  viewCount: number;
  downloadCount: number;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  thumbnailUrl: string;
  backgroundUrl: string;
  layout: 'classic' | 'modern' | 'minimal' | 'professional';
  colors: { primary: string; secondary: string; accent: string };
  fontFamily: string;
  includeQRCode: boolean;
  includeBlockchain: boolean;
}

export interface CertificateVerification {
  code: string;
  isValid: boolean;
  certificate?: VerifiableCertificate;
  verifiedAt: Date;
}

// ─── Africa-Focused Payment Types ─────────────────────────────────────────────

export type MobileMoneyProvider = 'mpesa' | 'airtel_money' | 'tigo_pesa' | 'mtn_momo' | 'orange_money';

export interface MobilePayment {
  id: string;
  userId: string;
  provider: MobileMoneyProvider;
  phoneNumber: string;
  amount: number;
  currency: 'TSH' | 'TZS' | 'UGX' | 'GHS' | 'NGN' | 'ZAR' | 'XOF' | 'XAF';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  transactionId?: string;
  reference: string;
  courseId?: string;
  cohortId?: string;
  metadata?: Record<string, unknown>;
  initiatedAt: Date;
  completedAt?: Date;
  failureReason?: string;
}

export interface OfflineContent {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  type: 'video' | 'document' | 'audio';
  fileUrl: string;
  fileSize: number;
  downloadedAt: Date;
  expiresAt: Date;
  lastAccessedAt?: Date;
  syncStatus: 'synced' | 'pending_sync' | 'sync_failed';
  progress?: number;
}

export interface LowDataSettings {
  userId: string;
  enabled: boolean;
  videoQuality: 'auto' | 'low' | 'medium' | 'high';
  autoDownload: boolean;
  downloadOnWifiOnly: boolean;
  compressImages: boolean;
  preloadNextLesson: boolean;
  dataUsedThisMonth: number; // in MB
  dataLimit?: number; // in MB
}

export type SupportedLanguage = 'en' | 'sw' | 'fr' | 'pt' | 'ar' | 'am' | 'ha' | 'yo' | 'zu';

export interface LocalizationSettings {
  userId: string;
  preferredLanguage: SupportedLanguage;
  secondaryLanguage?: SupportedLanguage;
  autoTranslate: boolean;
  subtitlesLanguage: SupportedLanguage;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  timezone: string;
}

// ─── Advanced Analytics Types ─────────────────────────────────────────────────

export interface EngagementHeatmap {
  courseId: string;
  lessonId: string;
  data: {
    timestamp: number; // seconds into video
    engagementScore: number; // 0-100
    watchCount: number;
    dropOffCount: number;
    replayCount: number;
  }[];
}

export interface DropOffAnalysis {
  courseId: string;
  topDropOffPoints: {
    lessonId: string;
    lessonTitle: string;
    dropOffRate: number;
    studentsLost: number;
    avgTimeBeforeDropOff: number;
    possibleReasons: string[];
  }[];
  overallCompletionRate: number;
  avgTimeToComplete: number;
}

export interface RevenueInsights {
  instructorId: string;
  period: 'day' | 'week' | 'month' | 'year';

  // Revenue metrics
  totalRevenue: number;
  netRevenue: number;
  refunds: number;
  platformFee: number;

  // Breakdown
  byCourse: { courseId: string; courseName: string; revenue: number; enrollments: number }[];
  byCountry: { country: string; revenue: number; percentage: number }[];
  byPaymentMethod: { method: string; revenue: number; percentage: number }[];

  // Trends
  dailyRevenue: { date: string; revenue: number; enrollments: number }[];
  projectedMonthlyRevenue: number;

  // Comparisons
  vsLastPeriod: number; // percentage change
  vsSamePeriodLastYear?: number;
}

export interface StudentEngagementMetrics {
  userId: string;
  courseId: string;

  // Time metrics
  totalTimeSpent: number;
  avgSessionDuration: number;
  sessionsCount: number;

  // Activity metrics
  lessonsViewed: number;
  lessonReplayRate: number;
  quizAttempts: number;
  assignmentsSubmitted: number;

  // Engagement patterns
  mostActiveHours: number[];
  mostActiveDays: string[];
  lastActivity: Date;

  // Risk indicators
  riskLevel: 'low' | 'medium' | 'high';
  daysSinceLastActivity: number;
  behindSchedule: boolean;
}

// ─── Subscription & Monetization Types ────────────────────────────────────────

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'career_track';

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: 'active' | 'cancelled' | 'past_due' | 'expired';

  // Billing
  pricePerMonth: number;
  pricePerYear: number;
  billingCycle: 'monthly' | 'yearly';
  currency: string;

  // Period
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;

  // Features
  features: SubscriptionFeature[];

  // Payment
  paymentMethodId?: string;
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionFeature {
  key: string;
  name: string;
  included: boolean;
  limit?: number;
  used?: number;
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: { key: string; name: string; included: boolean; limit?: number }[];
}> = {
  free: {
    name: 'Free',
    description: 'Get started with basic learning',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      { key: 'courses', name: 'Access to free courses', included: true },
      { key: 'certificates', name: 'Basic certificates', included: true },
      { key: 'community', name: 'Community access', included: true },
      { key: 'ai_assistant', name: 'AI Learning Assistant', included: false },
      { key: 'offline', name: 'Offline downloads', included: false },
      { key: 'career', name: 'Career pipeline access', included: false },
    ],
  },
  basic: {
    name: 'Basic',
    description: 'Essential learning features',
    monthlyPrice: 9.99,
    yearlyPrice: 99,
    features: [
      { key: 'courses', name: 'All courses access', included: true },
      { key: 'certificates', name: 'Verified certificates', included: true },
      { key: 'community', name: 'Community access', included: true },
      { key: 'ai_assistant', name: 'AI Learning Assistant', included: true, limit: 50 },
      { key: 'offline', name: 'Offline downloads', included: true, limit: 5 },
      { key: 'career', name: 'Career pipeline access', included: false },
    ],
  },
  pro: {
    name: 'Pro',
    description: 'Advanced learning and career tools',
    monthlyPrice: 29.99,
    yearlyPrice: 299,
    features: [
      { key: 'courses', name: 'All courses + cohorts', included: true },
      { key: 'certificates', name: 'Blockchain certificates', included: true },
      { key: 'community', name: 'Priority community', included: true },
      { key: 'ai_assistant', name: 'Unlimited AI Assistant', included: true },
      { key: 'offline', name: 'Unlimited offline', included: true },
      { key: 'career', name: 'Career pipeline access', included: true },
      { key: 'labs', name: 'Practical labs access', included: true },
      { key: 'mentorship', name: 'Group mentorship', included: true },
    ],
  },
  career_track: {
    name: 'Career Track',
    description: 'Complete career transformation',
    monthlyPrice: 99.99,
    yearlyPrice: 999,
    features: [
      { key: 'courses', name: 'Everything in Pro', included: true },
      { key: 'certificates', name: 'Professional credentials', included: true },
      { key: 'mentorship', name: '1:1 Mentorship', included: true },
      { key: 'career', name: 'Priority job matching', included: true },
      { key: 'internship', name: 'Internship placement', included: true },
      { key: 'resume', name: 'Resume review', included: true },
      { key: 'interview', name: 'Interview prep', included: true },
    ],
  },
};

export interface CorporatePackage {
  id: string;
  organizationId: string;
  organizationName: string;

  // Package details
  type: 'team' | 'department' | 'enterprise';
  seats: number;
  usedSeats: number;

  // Pricing
  pricePerSeat: number;
  totalPrice: number;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';

  // Features
  customBranding: boolean;
  ssoEnabled: boolean;
  dedicatedSupport: boolean;
  customCourses: boolean;
  analyticsAccess: boolean;
  apiAccess: boolean;

  // Contract
  contractStartDate: Date;
  contractEndDate: Date;
  autoRenew: boolean;

  status: 'active' | 'expired' | 'cancelled';
  createdAt: Date;
}

// ─── Notification Types ───────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export type NotificationType =
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

// ─── Chat & Messaging Types ───────────────────────────────────────────────────

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type ConversationType = 'direct' | 'course' | 'support' | 'group';
export type MessageType = 'text' | 'image' | 'file' | 'audio' | 'video' | 'link' | 'system';

export interface Conversation {
  id: string;
  type: ConversationType;
  title?: string;
  courseId?: string;
  courseName?: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipant {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'student' | 'instructor' | 'admin' | 'support';
  isOnline: boolean;
  lastSeen?: Date;
  joinedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: 'student' | 'instructor' | 'admin' | 'support';
  type: MessageType;
  content: string;
  attachments?: MessageAttachment[];
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
  reactions?: MessageReaction[];
  status: MessageStatus;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  readBy: { participantId: string; readAt: Date }[];
  createdAt: Date;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'file' | 'audio' | 'video';
  name: string;
  url: string;
  size: number;
  mimeType: string;
  thumbnailUrl?: string;
  duration?: number; // for audio/video
}

export interface MessageReaction {
  emoji: string;
  userIds: string[];
  count: number;
}

export interface ChatUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'student' | 'instructor' | 'admin' | 'support';
  isOnline: boolean;
  lastSeen?: Date;
  enrolledCourses?: string[];
  teachingCourses?: string[];
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
  timestamp: Date;
}

export interface ChatSettings {
  userId: string;
  allowMessagesFrom: 'everyone' | 'enrolled_only' | 'instructors_only' | 'none';
  emailNotifications: boolean;
  pushNotifications: boolean;
  showReadReceipts: boolean;
  showOnlineStatus: boolean;
  autoArchiveAfterDays?: number;
}

// ─── Africa Countries & Currencies ────────────────────────────────────────────

export const AFRICAN_COUNTRIES = [
  { code: 'KE', name: 'Kenya', currency: 'TSH', mobilePayments: ['mpesa'] },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', mobilePayments: ['mpesa', 'tigo_pesa', 'airtel_money'] },
  { code: 'UG', name: 'Uganda', currency: 'UGX', mobilePayments: ['mtn_momo', 'airtel_money'] },
  { code: 'GH', name: 'Ghana', currency: 'GHS', mobilePayments: ['mtn_momo', 'airtel_money'] },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', mobilePayments: ['mtn_momo'] },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', mobilePayments: [] },
  { code: 'RW', name: 'Rwanda', currency: 'RWF', mobilePayments: ['mtn_momo', 'airtel_money'] },
  { code: 'ET', name: 'Ethiopia', currency: 'ETB', mobilePayments: [] },
  { code: 'CI', name: 'Ivory Coast', currency: 'XOF', mobilePayments: ['orange_money', 'mtn_momo'] },
  { code: 'SN', name: 'Senegal', currency: 'XOF', mobilePayments: ['orange_money'] },
  { code: 'CM', name: 'Cameroon', currency: 'XAF', mobilePayments: ['mtn_momo', 'orange_money'] },
  { code: 'EG', name: 'Egypt', currency: 'EGP', mobilePayments: [] },
  { code: 'MA', name: 'Morocco', currency: 'MAD', mobilePayments: [] },
];

export const MOBILE_PAYMENT_PROVIDERS: Record<MobileMoneyProvider, {
  name: string;
  logo: string;
  countries: string[];
  ussdCode?: string;
}> = {
  mpesa: { name: 'M-Pesa', logo: '/payments/mpesa.png', countries: ['KE', 'TZ'], ussdCode: '*334#' },
  airtel_money: { name: 'Airtel Money', logo: '/payments/airtel.png', countries: ['KE', 'TZ', 'UG', 'RW', 'GH'] },
  tigo_pesa: { name: 'Tigo Pesa', logo: '/payments/tigo.png', countries: ['TZ'], ussdCode: '*150*01#' },
  mtn_momo: { name: 'MTN Mobile Money', logo: '/payments/mtn.png', countries: ['UG', 'GH', 'RW', 'CI', 'CM', 'NG'] },
  orange_money: { name: 'Orange Money', logo: '/payments/orange.png', countries: ['CI', 'SN', 'CM'] },
};

