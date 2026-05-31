// College Student Management System Types
// This file defines types for the simplified college management system

// ─── User & Role Types ───────────────────────────────────────────────────────────

export type UserRole = 'student' | 'instructor' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  phone?: string;
  country?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

// ─── Student Registration Types ───────────────────────────────────────────────────

export type RegistrationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'payment_pending' | 'payment_completed' | 'registered';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'mpesa' | 'card' | 'bank_transfer' | 'cash';
export type FeeType = 'registration_fee' | 'tuition_fee' | 'library_fee' | 'laboratory_fee' | 'examination_fee' | 'hostel_fee' | 'other';

export interface StudentRegistration {
  id: string;
  userId: string;
  registrationNumber?: string; // Assigned after approval

  // Personal Information
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;

  // National ID Information
  nationalId: string;
  nationalIdType: 'passport' | 'national_id' | 'birth_certificate';
  nationalIdExpiryDate?: Date;

  // Academic Information (Multiple qualifications)
  academicQualifications: AcademicQualification[];

  // Program Information
  programId: string;
  programName: string;
  department: string;
  intake: string; // e.g., "January 2026", "September 2026"
  studyMode: 'full_time' | 'part_time' | 'distance_learning';

  // Guardian Information
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianRelationship: string;
  guardianAddress: string;

  // Documents
  documents: RegistrationDocument[];

  // Status
  status: RegistrationStatus;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: Date;

  // Payments (Multiple payments)
  payments: RegistrationPayment[];

  // Timestamps
  submittedAt: Date;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AcademicQualification {
  id: string;
  level: 'o_level' | 'a_level' | 'certificate' | 'diploma' | 'degree' | 'other';
  institutionName: string;
  institutionAddress: string;
  country: string;
  startDate: Date;
  endDate: Date;
  examinationBoard?: string;
  indexNumber?: string;
  grade?: string;
  gpa?: number;
  major?: string;
  documentId?: string; // Reference to uploaded document
  createdAt: Date;
}

export interface RegistrationDocument {
  id: string;
  registrationId: string;
  type: 'national_id' | 'birth_certificate' | 'academic_transcripts' | 'passport_photo' | 'other';
  name: string;
  url: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
}

export interface RegistrationPayment {
  id: string;
  registrationId: string;
  feeType: FeeType;
  description: string;
  amount: number;
  currency: string;
  controlNumber: string; // Unique control number for this payment
  method: PaymentMethod;
  transactionId?: string;
  status: PaymentStatus;
  failureReason?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Program {
  id: string;
  code: string;
  name: string;
  department: string;
  duration: number; // in years
  description: string;
  requirements: string[];
  tuitionFee: number;
  fees?: { name: string; amount: string; description?: string }[];
  currency: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  headOfDepartment?: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
}

// ─── Academic Record Types ───────────────────────────────────────────────────────

export type Semester = 'first' | 'second' | 'summer';
export type AcademicYear = string; // e.g., "2025/2026"

export interface StudentProfile {
  id: string;
  userId: string;
  registrationId: string;
  registrationNumber: string;
  studentName?: string;
  programId: string;
  programName: string;
  department: string;
  intake: string;
  studyMode: 'full_time' | 'part_time' | 'distance_learning';
  currentYear: number;
  currentSemester: Semester;
  currentAcademicYear: AcademicYear;
  gpa?: number;
  cgpa?: number;
  totalCreditsEarned: number;
  status: 'active' | 'probation' | 'suspended' | 'graduated' | 'withdrawn';
  advisorId?: string; // Assigned instructor
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseOffering {
  id: string;
  code: string;
  name: string;
  department: string;
  credits: number;
  description: string;
  prerequisiteCourseIds?: string[];
  instructorId?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface SemesterRegistration {
  id: string;
  studentProfileId: string;
  academicYear: AcademicYear;
  semester: Semester;
  registeredCourses: RegisteredCourse[];
  totalCredits: number;
  status: 'pending' | 'approved' | 'rejected';
  registeredAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface RegisteredCourse {
  courseOfferingId: string;
  courseCode: string;
  courseName: string;
  credits: number;
  instructorId?: string;
}

// ─── Result Types ───────────────────────────────────────────────────────────────

export type GradeScale = 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'F' | 'I' | 'W';

export interface GradePoint {
  grade: GradeScale;
  points: number;
  minScore: number;
  maxScore: number;
}

export const DEFAULT_GRADE_SCALE: GradePoint[] = [
  { grade: 'A', points: 4.0, minScore: 70, maxScore: 100 },
  { grade: 'A-', points: 3.7, minScore: 65, maxScore: 69 },
  { grade: 'B+', points: 3.3, minScore: 60, maxScore: 64 },
  { grade: 'B', points: 3.0, minScore: 55, maxScore: 59 },
  { grade: 'B-', points: 2.7, minScore: 50, maxScore: 54 },
  { grade: 'C+', points: 2.3, minScore: 45, maxScore: 49 },
  { grade: 'C', points: 2.0, minScore: 40, maxScore: 44 },
  { grade: 'C-', points: 1.7, minScore: 35, maxScore: 39 },
  { grade: 'D+', points: 1.3, minScore: 30, maxScore: 34 },
  { grade: 'D', points: 1.0, minScore: 25, maxScore: 29 },
  { grade: 'F', points: 0.0, minScore: 0, maxScore: 24 },
  { grade: 'I', points: 0.0, minScore: 0, maxScore: 0 }, // Incomplete
  { grade: 'W', points: 0.0, minScore: 0, maxScore: 0 }, // Withdrawn
];

export interface ExamResult {
  id: string;
  studentProfileId: string;
  registrationNumber: string;
  studentName: string;

  // Exam Details
  academicYear: AcademicYear;
  semester: Semester;
  courseOfferingId: string;
  courseCode: string;
  courseName: string;
  credits: number;
  instructorId: string;
  instructorName: string;

  // Scores
  cat1Score?: number; // Continuous Assessment Test 1
  cat2Score?: number; // Continuous Assessment Test 2
  assignmentScore?: number;
  finalExamScore: number;
  totalScore: number;

  // Grade
  grade: GradeScale;
  gradePoints: number;

  // Status
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  remarks?: string;

  // Approval
  submittedBy: string;
  submittedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface SemesterResult {
  id: string;
  studentProfileId: string;
  registrationNumber: string;
  studentName: string;
  programName: string;
  department: string;

  academicYear: AcademicYear;
  semester: Semester;

  courseResults: ExamResult[];
  totalCredits: number;
  semesterGPA: number;
  previousCGPA: number;
  newCGPA: number;

  status: 'published' | 'unpublished';
  publishedBy?: string;
  publishedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface ResultTranscript {
  studentProfileId: string;
  registrationNumber: string;
  studentName: string;
  programName: string;
  department: string;
  admissionDate: Date;
  expectedGraduationDate: Date;

  semesterResults: SemesterResult[];
  overallCGPA: number;
  totalCreditsEarned: number;
  classHonour?: string;

  generatedAt: Date;
  generatedBy: string;
}

// ─── Instructor Assignment Types ─────────────────────────────────────────────────

export interface InstructorAssignment {
  id: string;
  instructorId: string;
  instructorName: string;
  courseOfferingId: string;
  courseCode: string;
  courseName: string;
  department: string;
  academicYear: AcademicYear;
  semester: Semester;
  assignedBy: string;
  assignedAt: Date;
  isActive: boolean;
}

// ─── Fee Structure Types ─────────────────────────────────────────────────────────

export interface FeeStructure {
  id: string;
  programId: string;
  programName: string;
  academicYear: AcademicYear;
  studyMode: 'full_time' | 'part_time' | 'distance_learning';

  tuitionFee: number;
  registrationFee: number;
  libraryFee: number;
  laboratoryFee: number;
  examinationFee: number;
  studentUnionFee: number;
  medicalFee: number;
  otherFees?: { name: string; amount: number }[];

  totalFee: number;
  currency: string;
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date;
  createdAt: Date;
}

// ─── System Settings Types ───────────────────────────────────────────────────────

export interface SystemSettings {
  id: string;
  currentAcademicYear: AcademicYear;
  currentSemester: Semester;
  registrationOpen: boolean;
  resultPublicationOpen: boolean;
  collegeName: string;
  collegeLogo?: string;
  collegeAddress: string;
  collegePhone: string;
  collegeEmail: string;
  website?: string;

  // Grade Scale (customizable)
  gradeScale: GradePoint[];

  // Fee Settings
  currency: string;
  paymentMethods: PaymentMethod[];

  updatedAt: Date;
}

// ─── Notification Types ───────────────────────────────────────────────────────────

export interface CollegeNotification {
  id: string;
  userId: string;
  type: 'registration_status' | 'payment_status' | 'result_published' | 'general';
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

// ─── Report Types ───────────────────────────────────────────────────────────────

export interface RegistrationReport {
  totalRegistrations: number;
  pending: number;
  approved: number;
  rejected: number;
  paymentPending: number;
  paymentCompleted: number;
  byProgram: { programName: string; count: number }[];
  byDepartment: { department: string; count: number }[];
  byIntake: { intake: string; count: number }[];
  totalRevenue: number;
  generatedAt: Date;
}

export interface ResultReport {
  totalResults: number;
  published: number;
  unpublished: number;
  averageGPA: number;
  byDepartment: { department: string; averageGPA: number; studentCount: number }[];
  byProgram: { programName: string; averageGPA: number; studentCount: number }[];
  gradeDistribution: { grade: GradeScale; count: number; percentage: number }[];
  generatedAt: Date;
}

// ─── Form Data Types ─────────────────────────────────────────────────────────────

export interface RegistrationFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  nationalId: string;
  nationalIdType?: 'passport' | 'national_id' | 'birth_certificate';
  nationalIdExpiryDate?: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;

  // Academic Information (Multiple qualifications)
  academicQualifications: {
    level: 'o_level' | 'a_level' | 'certificate' | 'diploma' | 'degree' | 'other';
    institutionName: string;
    institutionAddress: string;
    country: string;
    startDate: string;
    endDate: string;
    examinationBoard?: string;
    indexNumber?: string;
    grade?: string;
    gpa?: number;
    major?: string;
    document?: File;
  }[];

  // Program Information
  programId: string;
  intake: string;
  studyMode: 'full_time' | 'part_time' | 'distance_learning';

  // Guardian Information
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  guardianRelationship: string;
  guardianAddress: string;

  // Documents
  documents: File[];
  nationalIdDocument?: File;
}

export interface ExamResultFormData {
  studentProfileId: string;
  academicYear: string;
  semester: Semester;
  courseOfferingId: string;
  cat1Score?: number;
  cat2Score?: number;
  assignmentScore?: number;
  finalExamScore: number;
  remarks?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────────

export const STUDY_MODES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'distance_learning', label: 'Distance Learning' },
] as const;

export const SEMESTERS = [
  { value: 'first', label: 'First Semester' },
  { value: 'second', label: 'Second Semester' },
  { value: 'summer', label: 'Summer Semester' },
] as const;

export const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
] as const;

export const DOCUMENT_TYPES = [
  { value: 'national_id', label: 'National ID' },
  { value: 'birth_certificate', label: 'Birth Certificate' },
  { value: 'academic_transcripts', label: 'Academic Transcripts' },
  { value: 'passport_photo', label: 'Passport Photo' },
  { value: 'other', label: 'Other' },
] as const;
