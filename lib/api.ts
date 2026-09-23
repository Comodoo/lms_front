// API Service Layer for Backend Integration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
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

// Fetch every page of a paginated endpoint (defaulting to arrays) so existing
// callers keep working, and to bound the payload per request.
async function fetchAll<T>(endpoint: string, perPage = 200): Promise<T[]> {
  const out: T[] = [];
  let page = 1;

  for (;;) {
    const sep = endpoint.includes('?') ? '&' : '?';
    const res = await apiFetch<Paginated<T> | T[]>(
      `${endpoint}${sep}page=${page}&per_page=${perPage}`
    );
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

  return out;
}

// Generic fetch wrapper with auth token
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('auth_token');

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 && endpoint !== '/auth/login') {
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = '/login';
        }
      }
      return { error: data.message || data.error || 'Request failed' };
    }

    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Network error' };
  }
}

// Auth API
export const authApi = {
  async login(email: string, password: string) {
    return apiFetch<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async me() {
    return apiFetch<any>('/auth/profile', { method: 'GET' });
  },

  async register(data: any) {
    return apiFetch<{ user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async logout() {
    return apiFetch('/auth/logout', { method: 'POST' });
  },

  async getProfile() {
    return apiFetch('/auth/profile');
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
    return { data };
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
    return { data };
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
    return { data };
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
    return { data };
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
  permissions?: { id: number; code: string; module: string; action: string; label: string; hint?: string }[];
}

export interface PermissionRecord {
  id: number;
  code: string;
  module: string;
  action: string;
  label: string;
  hint?: string;
}

export const rolesApi = {
  async getAll() {
    return apiFetch<RoleRecord[]>('/roles');
  },

  async getPermissions() {
    return apiFetch<PermissionRecord[]>('/roles/permissions');
  },

  async getUsers() {
    return apiFetch<any[]>('/roles/users');
  },

  async create(data: { id?: string; name: string; description?: string; permissions?: string[] }) {
    return apiFetch('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

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
