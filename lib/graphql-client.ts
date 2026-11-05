/**
 * AfriLearn LMS - GraphQL Client
 * Handles all API communication with the Python backend
 */

const GRAPHQL_ENDPOINT = '/api/graphql';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  avatar?: string;
  bio?: string;
  country: string;
  phone?: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  language: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription?: string;
  instructorId: string;
  category: string;
  subcategory?: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  language: string;
  price: number;
  currency: string;
  discountPrice?: number;
  thumbnail?: string;
  previewVideo?: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  isFeatured: boolean;
  isBestseller: boolean;
  totalDuration: number;
  totalLessons: number;
  totalStudents: number;
  averageRating: number;
  totalReviews: number;
  requirements: string[];
  learningOutcomes: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  instructor?: Instructor;
  sections?: Section[];
  reviews?: Review[];
  isEnrolled?: boolean;
}

export interface Instructor {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  totalStudents: number;
  totalCourses: number;
  averageRating: number;
}

export interface Section {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
  totalDuration: number;
}

export interface Lesson {
  id: string;
  sectionId: string;
  courseId: string;
  title: string;
  description?: string;
  type: 'VIDEO' | 'ARTICLE' | 'QUIZ' | 'ASSIGNMENT' | 'LIVE_SESSION';
  content?: string;
  videoUrl?: string;
  duration: number;
  order: number;
  isFree: boolean;
  isPublished: boolean;
  isCompleted?: boolean;
}

export interface Review {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  title?: string;
  content?: string;
  isVerified: boolean;
  helpfulCount: number;
  createdAt: string;
  user?: User;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'REFUNDED';
  progress: number;
  completedLessons: string[];
  currentLessonId?: string;
  enrolledAt: string;
  completedAt?: string;
  expiresAt?: string;
  certificateId?: string;
  course?: Course;
}

export interface AuthPayload {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}

// ─── Client ───────────────────────────────────────────────────────────────────

class GraphQLClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('afrilearn_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('afrilearn_token', token);
      } else {
        localStorage.removeItem('afrilearn_token');
      }
    }
  }

  getToken() {
    return this.token;
  }

  async query<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response: any = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
    });

    const result: GraphQLResponse<T> = await response.json();

    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors[0].message);
    }

    return result.data as T;
  }

  async mutation<T>(mutation: string, variables?: Record<string, unknown>): Promise<T> {
    return this.query<T>(mutation, variables);
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export const QUERIES = {
  ME: `
    query Me {
      me {
        id
        email
        name
        role
        status
        avatar
        bio
        country
        phone
        emailVerified
        twoFactorEnabled
        language
        timezone
        createdAt
        updatedAt
        lastLogin
      }
    }
  `,

  COURSES: `
    query Courses($filter: CourseFilterInput, $page: Int, $perPage: Int) {
      courses(filter: $filter, page: $page, perPage: $perPage) {
        edges {
          id
          slug
          title
          shortDescription
          category
          level
          price
          currency
          discountPrice
          thumbnail
          isFeatured
          isBestseller
          totalDuration
          totalLessons
          totalStudents
          averageRating
          totalReviews
          isEnrolled
          instructor {
            id
            name
            avatar
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          totalCount
          totalPages
          currentPage
          perPage
        }
      }
    }
  `,

  COURSE: `
    query Course($slug: String!) {
      course(slug: $slug) {
        id
        slug
        title
        description
        shortDescription
        category
        subcategory
        level
        language
        price
        currency
        discountPrice
        thumbnail
        previewVideo
        status
        isFeatured
        isBestseller
        totalDuration
        totalLessons
        totalStudents
        averageRating
        totalReviews
        requirements
        learningOutcomes
        tags
        isEnrolled
        instructor {
          id
          name
          avatar
          bio
          totalStudents
          totalCourses
          averageRating
        }
        sections {
          id
          title
          description
          order
          totalDuration
          lessons {
            id
            title
            type
            duration
            order
            isFree
            isCompleted
          }
        }
        reviews {
          id
          rating
          title
          content
          isVerified
          helpfulCount
          createdAt
          user {
            id
            name
            avatar
          }
        }
      }
    }
  `,

  MY_ENROLLMENTS: `
    query MyEnrollments($status: EnrollmentStatusGQL, $page: Int, $perPage: Int) {
      myEnrollments(status: $status, page: $page, perPage: $perPage) {
        edges {
          id
          status
          progress
          completedLessons
          currentLessonId
          enrolledAt
          completedAt
          certificateId
          course {
            id
            slug
            title
            thumbnail
            totalLessons
            totalDuration
          }
        }
        pageInfo {
          totalCount
          totalPages
          currentPage
        }
      }
    }
  `,

  MY_NOTIFICATIONS: `
    query MyNotifications($unreadOnly: Boolean, $page: Int, $perPage: Int) {
      myNotifications(unreadOnly: $unreadOnly, page: $page, perPage: $perPage) {
        edges {
          id
          type
          title
          message
          link
          isRead
          createdAt
        }
        pageInfo {
          totalCount
        }
      }
    }
  `,

  MY_CONVERSATIONS: `
    query MyConversations {
      myConversations {
        id
        type
        title
        isArchived
        updatedAt
        participants {
          id
          name
          avatar
        }
        lastMessage {
          id
          content
          createdAt
          sender {
            id
            name
          }
        }
        unreadCount
      }
    }
  `,

  ADMIN_STATS: `
    query AdminStats {
      adminStats {
        totalUsers
        totalStudents
        totalInstructors
        totalCourses
        publishedCourses
        totalEnrollments
        totalRevenue
        monthlyRevenue
        activeUsers
        newUsersThisMonth
        averageCourseRating
        completionRate
      }
    }
  `,

  ADMIN_USERS: `
    query AdminUsers($filter: AdminUserFilterInput, $page: Int, $perPage: Int) {
      adminUsers(filter: $filter, page: $page, perPage: $perPage) {
        edges {
          id
          email
          name
          role
          status
          country
          emailVerified
          createdAt
          lastLogin
        }
        pageInfo {
          totalCount
          totalPages
          currentPage
        }
      }
    }
  `,
};

// ─── Mutations ────────────────────────────────────────────────────────────────

export const MUTATIONS = {
  REGISTER: `
    mutation Register($input: RegisterInput!) {
      register(input: $input) {
        success
        message
        user {
          id
          email
          name
          role
        }
        token
      }
    }
  `,

  LOGIN: `
    mutation Login($input: LoginInput!) {
      login(input: $input) {
        success
        message
        user {
          id
          email
          name
          role
          status
          avatar
        }
        token
      }
    }
  `,

  LOGOUT: `
    mutation Logout {
      logout {
        success
        message
      }
    }
  `,

  UPDATE_PROFILE: `
    mutation UpdateProfile($input: UpdateUserInput!) {
      updateProfile(input: $input) {
        success
        message
        user {
          id
          name
          bio
          avatar
          phone
          country
          language
          timezone
        }
      }
    }
  `,

  ENROLL: `
    mutation Enroll($input: EnrollInput!) {
      enroll(input: $input) {
        success
        message
        enrollment {
          id
          status
          progress
          enrolledAt
          course {
            id
            slug
            title
          }
        }
        payment {
          id
          amount
          currency
          method
          status
        }
      }
    }
  `,

  UPDATE_PROGRESS: `
    mutation UpdateProgress($input: ProgressInput!) {
      updateProgress(input: $input) {
        success
        message
        enrollment {
          id
          progress
          completedLessons
        }
        certificate {
          id
          certificateNumber
          title
          issuedAt
        }
      }
    }
  `,

  CREATE_REVIEW: `
    mutation CreateReview($input: CreateReviewInput!) {
      createReview(input: $input) {
        success
        message
      }
    }
  `,

  CREATE_COURSE: `
    mutation CreateCourse($input: CreateCourseInput!) {
      createCourse(input: $input) {
        success
        message
        course {
          id
          slug
          title
          status
        }
      }
    }
  `,

  UPDATE_COURSE: `
    mutation UpdateCourse($id: String!, $input: UpdateCourseInput!) {
      updateCourse(id: $id, input: $input) {
        success
        message
        course {
          id
          slug
          title
        }
      }
    }
  `,

  PUBLISH_COURSE: `
    mutation PublishCourse($id: String!) {
      publishCourse(id: $id) {
        success
        message
        course {
          id
          status
          publishedAt
        }
      }
    }
  `,

  SEND_MESSAGE: `
    mutation SendMessage($input: SendMessageInput!) {
      sendMessage(input: $input) {
        success
        message
        sentMessage {
          id
          content
          createdAt
          sender {
            id
            name
          }
        }
      }
    }
  `,

  CREATE_CONVERSATION: `
    mutation CreateConversation($input: CreateConversationInput!) {
      createConversation(input: $input) {
        success
        message
        conversation {
          id
          type
          participants {
            id
            name
          }
        }
      }
    }
  `,

  ADMIN_UPDATE_USER: `
    mutation AdminUpdateUser($id: String!, $input: AdminUpdateUserInput!) {
      adminUpdateUser(id: $id, input: $input) {
        success
        message
      }
    }
  `,

  ADMIN_DELETE_USER: `
    mutation AdminDeleteUser($id: String!) {
      adminDeleteUser(id: $id) {
        success
        message
      }
    }
  `,

  ADMIN_UPDATE_COURSE: `
    mutation AdminUpdateCourse($id: String!, $input: AdminUpdateCourseInput!) {
      adminUpdateCourse(id: $id, input: $input) {
        success
        message
        course {
          id
          status
          isFeatured
        }
      }
    }
  `,
};

// ─── Export Client Instance ───────────────────────────────────────────────────

export const graphqlClient = new GraphQLClient();

// ─── Helper Functions ─────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<AuthPayload> {
  const result = await graphqlClient.mutation<{ login: AuthPayload }>(
    MUTATIONS.LOGIN,
    { input: { email, password } }
  );
  
  if (result.login.success && result.login.token) {
    graphqlClient.setToken(result.login.token);
  }
  
  return result.login;
}

export async function logout(): Promise<void> {
  await graphqlClient.mutation(MUTATIONS.LOGOUT);
  graphqlClient.setToken(null);
}

export async function register(
  email: string,
  password: string,
  name: string,
  country: string = 'Kenya',
  role: 'STUDENT' | 'INSTRUCTOR' = 'STUDENT'
): Promise<AuthPayload> {
  const result = await graphqlClient.mutation<{ register: AuthPayload }>(
    MUTATIONS.REGISTER,
    { input: { email, password, name, country, role } }
  );
  
  if (result.register.success && result.register.token) {
    graphqlClient.setToken(result.register.token);
  }
  
  return result.register;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const result = await graphqlClient.query<{ me: User | null }>(QUERIES.ME);
    return result.me;
  } catch {
    return null;
  }
}

export async function getCourses(
  filter?: {
    category?: string;
    level?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    search?: string;
    isFree?: boolean;
    isFeatured?: boolean;
  },
  page = 1,
  perPage = 12
) {
  return graphqlClient.query<{
    courses: {
      edges: Course[];
      pageInfo: PageInfo;
    };
  }>(QUERIES.COURSES, { filter, page, perPage });
}

export async function getCourse(slug: string): Promise<Course | null> {
  const result = await graphqlClient.query<{ course: Course | null }>(
    QUERIES.COURSE,
    { slug }
  );
  return result.course;
}

export async function enrollInCourse(
  courseId: string,
  paymentMethod: 'MPESA' | 'CARD' | 'BANK_TRANSFER' | 'PAYPAL',
  phoneNumber?: string
) {
  return graphqlClient.mutation<{
    enroll: {
      success: boolean;
      message: string;
      enrollment?: Enrollment;
    };
  }>(MUTATIONS.ENROLL, {
    input: { courseId, paymentMethod, phoneNumber }
  });
}

export async function updateProgress(
  enrollmentId: string,
  lessonId: string,
  completed = true
) {
  return graphqlClient.mutation<{
    updateProgress: {
      success: boolean;
      message: string;
      enrollment?: Enrollment;
      certificate?: {
        id: string;
        certificateNumber: string;
        title: string;
        issuedAt: string;
      };
    };
  }>(MUTATIONS.UPDATE_PROGRESS, {
    input: { enrollmentId, lessonId, completed }
  });
}

// ─── Cohorts ─────────────────────────────────────────────────────────────────

export async function getCohorts(courseId?: string, status?: string) {
  const query = `
    query Cohorts($courseId: String, $status: CohortStatus) {
      cohorts(courseId: $courseId, status: $status) {
        cohorts {
          id
          name
          description
          courseId
          status
          maxMembers
          currentMembers
          startDate
          endDate
          price
          currency
          isEnrollable
          spotsLeft
        }
        total
        hasMore
      }
    }
  `;
  return graphqlClient.query<{ cohorts: { cohorts: any[]; total: number; hasMore: boolean } }>(
    query, { courseId, status }
  );
}

export async function joinCohort(cohortId: string) {
  const mutation = `
    mutation JoinCohort($cohortId: String!) {
      joinCohort(cohortId: $cohortId) {
        success
        message
        cohort {
          id
          name
          currentMembers
        }
      }
    }
  `;
  return graphqlClient.mutation<{ joinCohort: { success: boolean; message: string; cohort?: any } }>(
    mutation, { cohortId }
  );
}

export async function getMyCohorts() {
  const query = `
    query MyCohorts {
      myCohorts {
        id
        name
        description
        courseId
        status
        startDate
        endDate
        meetingLink
      }
    }
  `;
  return graphqlClient.query<{ myCohorts: any[] }>(query);
}

// ─── Teams ───────────────────────────────────────────────────────────────────

export async function getMyTeams() {
  const query = `
    query MyTeams {
      myTeams {
        id
        name
        slug
        description
        planType
        maxMembers
        currentMembers
        features
      }
    }
  `;
  return graphqlClient.query<{ myTeams: any[] }>(query);
}

export async function createTeam(name: string, description: string, billingEmail: string, planType = 'STARTER') {
  const mutation = `
    mutation CreateTeam($input: CreateTeamInput!) {
      createTeam(input: $input) {
        success
        message
        team {
          id
          name
          slug
        }
      }
    }
  `;
  return graphqlClient.mutation<{ createTeam: { success: boolean; message: string; team?: any } }>(
    mutation, { input: { name, description, billingEmail, planType } }
  );
}

export async function inviteTeamMember(teamId: string, email: string, role = 'member') {
  const mutation = `
    mutation InviteTeamMember($teamId: String!, $input: InviteTeamMemberInput!) {
      inviteTeamMember(teamId: $teamId, input: $input) {
        success
        message
        invite {
          id
          email
          expiresAt
        }
      }
    }
  `;
  return graphqlClient.mutation<{ inviteTeamMember: { success: boolean; message: string; invite?: any } }>(
    mutation, { teamId, input: { email, role } }
  );
}

export async function getTeamAnalytics(teamId: string) {
  const query = `
    query TeamAnalytics($teamId: String!) {
      teamAnalytics(teamId: $teamId) {
        totalMembers
        activeMembers
        coursesInProgress
        coursesCompleted
        averageProgress
        totalLearningHours
        completionRate
      }
    }
  `;
  return graphqlClient.query<{ teamAnalytics: any }>(query, { teamId });
}

// ─── Onboarding ──────────────────────────────────────────────────────────────

export async function getMyOnboarding() {
  const query = `
    query GetMyOnboarding {
      myOnboarding {
        id
        onboardingType
        status
        currentStep
        totalSteps
        startedAt
        completedAt
        data
      }
    }
  `;
  return graphqlClient.query<{ myOnboarding: any }>(query);
}

export async function startOnboarding(onboardingType: string) {
  const mutation = `
    mutation StartOnboarding($input: StartOnboardingInput!) {
      startOnboarding(input: $input) {
        success
        message
        onboarding {
          id
          status
          currentStep
        }
      }
    }
  `;
  return graphqlClient.mutation<{ startOnboarding: any }>(mutation, { 
    input: { onboardingType } 
  });
}

export async function updateOnboardingStep(step: number, data: any) {
  const mutation = `
    mutation UpdateOnboardingStep($input: UpdateOnboardingStepInput!) {
      updateOnboardingStep(input: $input) {
        success
        message
        onboarding {
          id
          currentStep
          data
        }
      }
    }
  `;
  return graphqlClient.mutation<{ updateOnboardingStep: any }>(mutation, { 
    input: { step, data: JSON.stringify(data) } 
  });
}

export async function completeOnboarding() {
  const mutation = `
    mutation CompleteOnboarding {
      completeOnboarding {
        success
        message
      }
    }
  `;
  return graphqlClient.mutation<{ completeOnboarding: any }>(mutation);
}

export async function deleteOnboarding() {
  const mutation = `
    mutation DeleteOnboarding {
      deleteOnboarding {
        success
        message
      }
    }
  `;
  return graphqlClient.mutation<{ deleteOnboarding: any }>(mutation);
}

// Admin Onboarding Management
export async function getAdminOnboardings(status?: string, type?: string, page = 1, limit = 20) {
  const query = `
    query AdminOnboardings($status: OnboardingStatus, $type: OnboardingType, $page: Int, $limit: Int) {
      adminOnboardings(status: $status, type: $type, page: $page, limit: $limit) {
        onboardings {
          id
          userId
          onboardingType
          status
          currentStep
          totalSteps
          startedAt
          completedAt
          data
        }
        total
        hasMore
      }
    }
  `;
  return graphqlClient.query<{ adminOnboardings: any }>(query, { status, type, page, limit });
}

export async function adminApproveOnboarding(onboardingId: string) {
  const mutation = `
    mutation AdminApproveOnboarding($onboardingId: String!) {
      adminApproveOnboarding(onboardingId: $onboardingId) {
        success
        message
      }
    }
  `;
  return graphqlClient.mutation<{ adminApproveOnboarding: any }>(mutation, { onboardingId });
}

export async function adminRejectOnboarding(onboardingId: string, reason: string) {
  const mutation = `
    mutation AdminRejectOnboarding($onboardingId: String!, $reason: String!) {
      adminRejectOnboarding(onboardingId: $onboardingId, reason: $reason) {
        success
        message
      }
    }
  `;
  return graphqlClient.mutation<{ adminRejectOnboarding: any }>(mutation, { onboardingId, reason });
}
