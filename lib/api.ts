// API Service Layer for Backend Integration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

/**
 * Machine-readable failure codes. UI code should branch on these rather than on
 * message text, so that "you don't have permission" is never rendered as
 * "failed to load roles" (which is what made permission bugs so hard to spot).
 */
export const API_ERROR = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  INSUFFICIENT_PERMISSION: 'INSUFFICIENT_PERMISSION',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER: 'SERVER_ERROR',
  NETWORK: 'NETWORK_ERROR',
} as const;

export type ApiErrorCode = (typeof API_ERROR)[keyof typeof API_ERROR];

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  /** HTTP status, absent only for network failures. */
  status?: number;
  /** One of API_ERROR. */
  code?: ApiErrorCode;
  /** Field-level validation errors, when the backend returns them. */
  errors?: Record<string, string[]>;
}

/** Human-facing message for a failure. Prefers the server's own text. */
export function describeApiError(res: { error?: string; code?: ApiErrorCode } | undefined): string {
  if (!res) return 'Something went wrong. Please try again.';
  if (res.code === API_ERROR.UNAUTHENTICATED) return 'Your session has expired. Please sign in again.';
  if (res.code === API_ERROR.INSUFFICIENT_PERMISSION) {
    return "You don't have permission to perform this action.";
  }
  if (res.code === API_ERROR.NOT_FOUND) return 'The requested record was not found.';
  if (res.code === API_ERROR.RATE_LIMITED) return 'Too many requests. Please wait a moment and try again.';
  if (res.code === API_ERROR.NETWORK) return 'Cannot reach the server. Check your connection and try again.';
  if (res.code === API_ERROR.SERVER) return 'The server ran into a problem. Please try again.';
  return res.error || 'Something went wrong. Please try again.';
}

/** True when a failure was a permission denial rather than a bug. */
export function isPermissionDenied(res: { code?: ApiErrorCode } | undefined): boolean {
  return res?.code === API_ERROR.INSUFFICIENT_PERMISSION;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface PaginationOptions {
  page?: number;
  per_page?: number;
}

function isPaginated(body: unknown): body is Paginated<any> {
  return (
    typeof body === 'object' &&
    body !== null &&
    Array.isArray((body as any).data) &&
    typeof (body as any).current_page === 'number' &&
    typeof (body as any).total === 'number'
  );
}

/** Read the bearer token without breaking server-side rendering. */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

/** Keys that constitute a session. Deliberately not `localStorage.clear()`. */
const AUTH_STORAGE_KEYS = ['auth_token', 'lms-auth', 'lms-users'];

function clearSession(): void {
  if (typeof window === 'undefined') return;
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  sessionStorage.removeItem('auth_token');
}

/** Map an HTTP status onto one of API_ERROR. */
function codeForStatus(status: number): ApiErrorCode {
  if (status === 401) return API_ERROR.UNAUTHENTICATED;
  if (status === 403) return API_ERROR.INSUFFICIENT_PERMISSION;
  if (status === 404) return API_ERROR.NOT_FOUND;
  if (status === 422) return API_ERROR.VALIDATION;
  if (status === 429) return API_ERROR.RATE_LIMITED;
  return API_ERROR.SERVER;
}

interface ApiFetchOptions extends RequestInit {
  /**
   * Set to false for endpoints the unauthenticated user must be able to call
   * (`/auth/login`, `/auth/register`) and for the profile call that the auth
   * provider itself makes, so a 401 clears the session exactly once.
   */
  skipAuthRedirect?: boolean;
}

// Fetch every page of a paginated endpoint (defaulting to arrays) so existing
// callers keep working, and to bound the payload per request.
async function fetchAll<T>(
  endpoint: string,
  perPage = 200
): Promise<ApiResponse<T[]>> {
  const out: T[] = [];
  let page = 1;

  for (;;) {
    const sep = endpoint.includes('?') ? '&' : '?';
    const res = await apiFetch<Paginated<T> | T[]>(
      `${endpoint}${sep}page=${page}&per_page=${perPage}`
    );

    // Propagate failures (401/403/404) instead of silently resolving to [],
    // which previously made a denied request look like "no records".
    if (res.error || res.status === 401 || res.status === 403 || res.status === 404) {
      return { error: res.error, message: res.message, status: res.status, code: res.code, errors: res.errors };
    }

    const body = res.data;

    if (isPaginated(body)) {
      out.push(...(body.data as T[]));
      if (page >= body.last_page) break;
    } else if (Array.isArray(body)) {
      out.push(...(body as T[]));
      break;
    } else {
      break;
    }

    page += 1;
  }

  return { data: out, status: 200 };
}

// Generic fetch wrapper with auth token
async function apiFetch<T>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<ApiResponse<T>> {
  const { skipAuthRedirect = false, ...init } = options;
  const token = getToken();

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (!(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (init.headers) {
    Object.assign(headers, init.headers as Record<string, string>);
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...init,
      headers,
      cache: 'no-store',
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Network error',
      code: API_ERROR.NETWORK,
    };
  }

  // Some endpoints (204, or a Laravel error with no body) have no JSON payload.
  const data = await response.json().catch(() => ({}) as any);

  if (!response.ok) {
    const code = codeForStatus(response.status);
    const serverMessage: string | undefined = data?.message ?? data?.error;

    // A 401 means the token is gone or expired. Tear the session down once and
    // tell the auth provider, which owns all redirect decisions.
    if (code === API_ERROR.UNAUTHENTICATED && !skipAuthRedirect) {
      clearSession();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    }

    return {
      error: serverMessage,
      message: serverMessage,
      status: response.status,
      code,
      errors: data?.errors,
    };
  }

  return { data, status: response.status };
}

// Auth API
export const authApi = {
  async login(email: string, password: string) {
    return apiFetch<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuthRedirect: true,
    });
  },

  /**
   * The server-authoritative view of the current user: identity, assigned role
   * ids and the resolved permission codes. This is the ONLY source used for
   * authorization decisions on the client.
   */
  async me() {
    return apiFetch<any>('/auth/profile', { method: 'GET', skipAuthRedirect: true });
  },

  async register(data: any) {
    return apiFetch<{ user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuthRedirect: true,
    });
  },

  async logout() {
    return apiFetch('/auth/logout', { method: 'POST', skipAuthRedirect: true });
  },

  async getProfile() {
    return apiFetch('/auth/profile', { skipAuthRedirect: true });
  },

  async updateProfile(data: any) {
    return apiFetch('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// Courses API
export const coursesApi = {
  async getAll() {
    return apiFetch('/courses');
  },

  async getById(id: string) {
    return apiFetch(`/courses/${id}`);
  },

  async create(data: any) {
    return apiFetch('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: any) {
    return apiFetch(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return apiFetch(`/courses/${id}`, { method: 'DELETE' });
  },

  async getInstructorAssignments(courseId: string) {
    return apiFetch(`/courses/${courseId}/instructors`);
  },

  async assignInstructor(courseId: string, data: any) {
    return apiFetch(`/courses/${courseId}/assign-instructor`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async removeInstructor(courseId: string, assignmentId: string) {
    return apiFetch(`/courses/${courseId}/remove-instructor/${assignmentId}`, {
      method: 'POST',
    });
  },

  async updateAssignmentStatus(assignmentId: string, data: { status: string }) {
    return apiFetch(`/instructor-assignments/${assignmentId}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getInstructors() {
    return apiFetch('/instructors');
  },

  async getMyCourses() {
    return apiFetch('/instructor/courses');
  },
};

// Payments API
export const paymentsApi = {
  async getAll(options?: PaginationOptions) {
    if (options?.page !== undefined || options?.per_page !== undefined) {
      const params = new URLSearchParams();
      if (options.page !== undefined) params.set('page', String(options.page));
      if (options.per_page !== undefined) params.set('per_page', String(options.per_page));
      return apiFetch(`/payments?${params}`);
    }
    const data = await fetchAll<any>('/payments');
    return data;
  },

  async getById(id: string) {
    return apiFetch(`/payments/${id}`);
  },

  async create(data: any) {
    return apiFetch('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async verifyCashPayment(id: string, data: any) {
    return apiFetch(`/payments/${id}/verify-cash`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getByStudent(studentId: string) {
    return apiFetch(`/students/${studentId}/payments`);
  },

  async getByRegistration(registrationId: string) {
    return apiFetch(`/registrations/${registrationId}/payments`);
  },
};

// Programs API
export const programsApi = {
  async getAll() {
    return apiFetch('/programs');
  },

  async getById(id: string) {
    return apiFetch(`/programs/${id}`);
  },

  async create(data: any) {
    return apiFetch('/programs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: any) {
    return apiFetch(`/programs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return apiFetch(`/programs/${id}`, { method: 'DELETE' });
  },
};

// Departments API
export const departmentsApi = {
  async getAll() {
    return apiFetch('/departments');
  },

  async create(data: any) {
    return apiFetch('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: any) {
    return apiFetch(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return apiFetch(`/departments/${id}`, { method: 'DELETE' });
  },
};

// Staff API
export const staffApi = {
  async getAll(role?: string, options?: PaginationOptions) {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (options?.page !== undefined) params.set('page', String(options.page));
    if (options?.per_page !== undefined) params.set('per_page', String(options.per_page));

    const query = params.toString() ? `?${params}` : '';

    if (params.has('page') || params.has('per_page')) {
      return apiFetch<Paginated<any>>(`/staff${query}`);
    }

    const data = await fetchAll<any>(`/staff${query}`);
    return data;
  },

  async getById(id: string) {
    return apiFetch(`/staff/${id}`);
  },

  async create(data: any) {
    return apiFetch('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: any) {
    return apiFetch(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return apiFetch(`/staff/${id}`, { method: 'DELETE' });
  },
};

// Credits API
export const creditsApi = {
  async getAll() {
    return apiFetch('/credits');
  },

  async getById(id: string) {
    return apiFetch(`/credits/${id}`);
  },

  async create(data: any) {
    return apiFetch('/credits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: any) {
    return apiFetch(`/credits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return apiFetch(`/credits/${id}`, { method: 'DELETE' });
  },
};

// Registrations API
export const registrationsApi = {
  async getAll(options?: PaginationOptions) {
    if (options?.page !== undefined || options?.per_page !== undefined) {
      const params = new URLSearchParams();
      if (options.page !== undefined) params.set('page', String(options.page));
      if (options.per_page !== undefined) params.set('per_page', String(options.per_page));
      return apiFetch(`/registrations?${params}`);
    }
    const data = await fetchAll<any>('/registrations');
    return data;
  },

  async getById(id: string) {
    return apiFetch(`/registrations/${id}`);
  },

  async create(data: any | FormData) {
    const isFormData = data instanceof FormData;
    return apiFetch('/registrations', {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
    });
  },

  async update(id: string, data: any) {
    return apiFetch(`/registrations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return apiFetch(`/registrations/${id}`, { method: 'DELETE' });
  },

  async getByStudent(studentId: string) {
    return apiFetch(`/students/${studentId}/registrations`);
  },
};

// Exam Results API
export const examResultsApi = {
  async getAll(options?: PaginationOptions) {
    if (options?.page !== undefined || options?.per_page !== undefined) {
      const params = new URLSearchParams();
      if (options.page !== undefined) params.set('page', String(options.page));
      if (options.per_page !== undefined) params.set('per_page', String(options.per_page));
      return apiFetch(`/exam-results?${params}`);
    }
    const data = await fetchAll<any>('/exam-results');
    return data;
  },

  async getById(id: string) {
    return apiFetch(`/exam-results/${id}`);
  },

  async create(data: any) {
    return apiFetch('/exam-results', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: any) {
    return apiFetch(`/exam-results/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return apiFetch(`/exam-results/${id}`, { method: 'DELETE' });
  },

  async submit(id: string) {
    return apiFetch(`/exam-results/${id}/submit`, { method: 'POST' });
  },

  async publish(id: string) {
    return apiFetch(`/exam-results/${id}/publish`, { method: 'POST' });
  },

  async reject(id: string, reason: string) {
    return apiFetch(`/exam-results/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async getStudentResults(studentId: string) {
    return apiFetch(`/students/${studentId}/results`);
  },

  async getCourseResults(courseOfferingId: string) {
    return apiFetch(`/course-offerings/${courseOfferingId}/results`);
  },
};

// Roles & Permissions API
export interface RoleRecord {
  id: string;
  name: string;
  description?: string | null;
  is_system: boolean;
  users_count?: number;
  /**
   * The backend may return codes (`["users.view"]`) or full records
   * (`[{ id, code, module, action }]`). Normalize with `toPermissionCodes`.
   */
  permissions?: (string | PermissionRecord)[] | null;
}

export interface PermissionRecord {
  id: number;
  code: string;
  module: string;
  action: string;
  label?: string;
  hint?: string;
}

export interface AssignableRole {
  id: string;
  name: string;
}

export interface RoleUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  roles?: AssignableRole[] | null;
}

export const rolesApi = {
  async getAll() {
    return apiFetch<RoleRecord[]>('/roles');
  },

  async getPermissions() {
    return apiFetch<PermissionRecord[]>('/roles/permissions');
  },

  async getUsers() {
    return apiFetch<RoleUser[]>('/roles/users');
  },

  async create(data: { name: string; description?: string; permissions?: string[] }) {
    return apiFetch('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * `permissions` is an array of canonical `"module.action"` codes. Sending the
   * full list is intentional: the matrix is the source of truth for a role, so
   * a partial update would make un-ticking a box impossible to persist.
   */
  async update(roleId: string, data: { name: string; description?: string; permissions?: string[] }) {
    return apiFetch(`/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(roleId: string) {
    return apiFetch(`/roles/${roleId}`, { method: 'DELETE' });
  },

  async assignRoles(userId: string | number, roleIds: string[]) {
    return apiFetch(`/roles/users/${userId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ role_ids: roleIds }),
    });
  },
};

// Dashboard API
export const dashboardApi = {
  async getStats() {
    return apiFetch('/dashboard/stats');
  },
  
  async getAccountantStats() {
    return apiFetch('/dashboard/accountant-stats');
  }
};
