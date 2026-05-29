// API Service Layer for Backend Integration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
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
  async getAll() {
    return apiFetch('/payments');
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
  async getAll(role?: string) {
    const url = role ? `/staff?role=${role}` : '/staff';
    return apiFetch(url);
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
  async getAll() {
    return apiFetch('/registrations');
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
  async getAll() {
    return apiFetch('/exam-results');
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

  async publish(id: string) {
    return apiFetch(`/exam-results/${id}/publish`, { method: 'POST' });
  },

  async getStudentResults(studentId: string) {
    return apiFetch(`/students/${studentId}/results`);
  },

  async getCourseResults(courseOfferingId: string) {
    return apiFetch(`/course-offerings/${courseOfferingId}/results`);
  },
};
