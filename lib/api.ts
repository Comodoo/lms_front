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
    const res: any = await apiFetch<Paginated<T> | T[]>(
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
    const response: any = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data: any = await response.json();

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
    const data: any = await fetchAll<any>('/payments');
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

    const data: any = await fetchAll<any>(`/staff${query}`);
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
    const data: any = await fetchAll<any>('/registrations');
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
    const data: any = await fetchAll<any>('/exam-results');
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

// Inventory API
function buildQuery(params?: Record<string, any>) {
  if (!params) return '';
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export const inventoryApi = {
  async getCategories(params?: Record<string, any>) {
    return apiFetch(`/inventory-categories${buildQuery(params)}`);
  },
  async createCategory(data: any) {
    return apiFetch('/inventory-categories', { method: 'POST', body: JSON.stringify(data) });
  },
  async getLocations(params?: Record<string, any>) {
    return apiFetch(`/inventory-locations${buildQuery(params)}`);
  },
  async createLocation(data: any) {
    return apiFetch('/inventory-locations', { method: 'POST', body: JSON.stringify(data) });
  },
  async getItems(params?: Record<string, any>) {
    return apiFetch(`/inventory-items${buildQuery(params)}`);
  },
  async getItem(id: string | number) {
    return apiFetch(`/inventory-items/${id}`);
  },
  async createItem(data: any) {
    return apiFetch('/inventory-items', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateItem(id: string | number, data: any) {
    return apiFetch(`/inventory-items/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteItem(id: string | number) {
    return apiFetch(`/inventory-items/${id}`, { method: 'DELETE' });
  },
  async receive(id: string | number, data: any) {
    return apiFetch(`/inventory-items/${id}/receive`, { method: 'POST', body: JSON.stringify(data) });
  },
  async assign(id: string | number, data: any) {
    return apiFetch(`/inventory-items/${id}/assign`, { method: 'POST', body: JSON.stringify(data) });
  },
  async transfer(id: string | number, data: any) {
    return apiFetch(`/inventory-items/${id}/transfer`, { method: 'POST', body: JSON.stringify(data) });
  },
  async returnItem(id: string | number, data: any) {
    return apiFetch(`/inventory-items/${id}/return`, { method: 'POST', body: JSON.stringify(data) });
  },
  async repair(id: string | number, data: any) {
    return apiFetch(`/inventory-items/${id}/repair`, { method: 'POST', body: JSON.stringify(data) });
  },
  async markLost(id: string | number, data: any) {
    return apiFetch(`/inventory-items/${id}/mark-lost`, { method: 'POST', body: JSON.stringify(data) });
  },
  async dispose(id: string | number, data: any) {
    return apiFetch(`/inventory-items/${id}/dispose`, { method: 'POST', body: JSON.stringify(data) });
  },
  async getHistory(id: string | number, params?: Record<string, any>) {
    return apiFetch(`/inventory-items/${id}/history${buildQuery(params)}`);
  },
  async getTransactions(params?: Record<string, any>) {
    return apiFetch(`/inventory-transactions${buildQuery(params)}`);
  },
  async getAudits(params?: Record<string, any>) {
    return apiFetch(`/inventory-audits${buildQuery(params)}`);
  },
  async createAudit(data: any) {
    return apiFetch('/inventory-audits', { method: 'POST', body: JSON.stringify(data) });
  },
};

// HR API
export const hrApi = {
  async getProfiles(params?: Record<string, any>) {
    return apiFetch(`/hr-profiles${buildQuery(params)}`);
  },
  async getProfile(id: string | number) {
    return apiFetch(`/hr-profiles/${id}`);
  },
  async createProfile(data: any) {
    return apiFetch('/hr-profiles', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateProfile(id: string | number, data: any) {
    return apiFetch(`/hr-profiles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async updateStatus(id: string | number, data: any) {
    return apiFetch(`/hr-profiles/${id}/status`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async getDocuments(id: string | number) {
    return apiFetch(`/hr-profiles/${id}/documents`);
  },
  async uploadDocument(id: string | number, formData: FormData) {
    return apiFetch(`/hr-profiles/${id}/documents`, { method: 'POST', body: formData, headers: {} });
  },
  async downloadDocument(profileId: string | number, documentId: string | number) {
    return apiFetch(`/hr-profiles/${profileId}/documents/${documentId}/download`);
  },
  async getLeave(id: string | number) {
    return apiFetch(`/hr-profiles/${id}/leave`);
  },
  async createLeave(id: string | number, data: any) {
    return apiFetch(`/hr-profiles/${id}/leave`, { method: 'POST', body: JSON.stringify(data) });
  },
  async approveLeave(id: string | number) {
    return apiFetch(`/hr-leave-records/${id}/approve`, { method: 'PUT' });
  },
  async rejectLeave(id: string | number) {
    return apiFetch(`/hr-leave-records/${id}/reject`, { method: 'PUT' });
  },
  async getStats() {
    return apiFetch('/hr-profiles/stats');
  },
};

// Audit Logs API
export const auditLogsApi = {
  async getAll(params?: Record<string, any>) {
    return apiFetch(`/audit-logs${buildQuery(params)}`);
  },
};

// Salary API
export const salaryApi = {
  async getGrades(params?: Record<string, any>) {
    return apiFetch(`/salary-grades${buildQuery(params)}`);
  },
  async createGrade(data: any) {
    return apiFetch('/salary-grades', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateGrade(id: string | number, data: any) {
    return apiFetch(`/salary-grades/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async getSteps(gradeId: string | number) {
    return apiFetch(`/salary-grades/${gradeId}/steps`);
  },
  async createStep(gradeId: string | number, data: any) {
    return apiFetch(`/salary-grades/${gradeId}/steps`, { method: 'POST', body: JSON.stringify(data) });
  },
  async updateStep(id: string | number, data: any) {
    return apiFetch(`/salary-steps/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async getAllowances(params?: Record<string, any>) {
    return apiFetch(`/salary-allowances${buildQuery(params)}`);
  },
  async createAllowance(data: any) {
    return apiFetch('/salary-allowances', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateAllowance(id: string | number, data: any) {
    return apiFetch(`/salary-allowances/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async getPlacements(params?: Record<string, any>) {
    return apiFetch(`/staff-salary-placements${buildQuery(params)}`);
  },
  async createPlacement(data: any) {
    return apiFetch('/staff-salary-placements', { method: 'POST', body: JSON.stringify(data) });
  },
  async updatePlacement(id: string | number, data: any) {
    return apiFetch(`/staff-salary-placements/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async getProjection(params?: Record<string, any>) {
    return apiFetch(`/salary-cost-projection${buildQuery(params)}`);
  },
};

// Budget API
export const budgetApi = {
  async getFiscalYears(params?: Record<string, any>) {
    return apiFetch(`/fiscal-years${buildQuery(params)}`);
  },
  async createFiscalYear(data: any) {
    return apiFetch('/fiscal-years', { method: 'POST', body: JSON.stringify(data) });
  },
  async getCategories(params?: Record<string, any>) {
    return apiFetch(`/budget-categories${buildQuery(params)}`);
  },
  async createCategory(data: any) {
    return apiFetch('/budget-categories', { method: 'POST', body: JSON.stringify(data) });
  },
  async getBudgets(params?: Record<string, any>) {
    return apiFetch(`/budgets${buildQuery(params)}`);
  },
  async getBudget(id: string | number) {
    return apiFetch(`/budgets/${id}`);
  },
  async createBudget(data: any) {
    return apiFetch('/budgets', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateBudget(id: string | number, data: any) {
    return apiFetch(`/budgets/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async addLine(id: string | number, data: any) {
    return apiFetch(`/budgets/${id}/lines`, { method: 'POST', body: JSON.stringify(data) });
  },
  async updateLine(id: string | number, data: any) {
    return apiFetch(`/budget-lines/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async submit(id: string | number) {
    return apiFetch(`/budgets/${id}/submit`, { method: 'POST' });
  },
  async review(id: string | number) {
    return apiFetch(`/budgets/${id}/review`, { method: 'POST' });
  },
  async approve(id: string | number) {
    return apiFetch(`/budgets/${id}/approve`, { method: 'POST' });
  },
  async reject(id: string | number, reason: string) {
    return apiFetch(`/budgets/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
  },
  async close(id: string | number) {
    return apiFetch(`/budgets/${id}/close`, { method: 'POST' });
  },
  async getExpenditures(lineId: string | number, params?: Record<string, any>) {
    return apiFetch(`/budget-lines/${lineId}/expenditures${buildQuery(params)}`);
  },
  async createExpenditure(lineId: string | number, data: any) {
    return apiFetch(`/budget-lines/${lineId}/expenditures`, { method: 'POST', body: JSON.stringify(data) });
  },
  async verifyExpenditure(id: string | number) {
    return apiFetch(`/budget-expenditures/${id}/verify`, { method: 'PUT' });
  },
  async getVariance(params?: Record<string, any>) {
    return apiFetch(`/budget-reports/variance${buildQuery(params)}`);
  },
  async getDepartmentSummary(params?: Record<string, any>) {
    return apiFetch(`/budget-reports/department-summary${buildQuery(params)}`);
  },
};

// Proposals API
export const proposalApi = {
  async getProposals(params?: Record<string, any>) {
    return apiFetch(`/proposals${buildQuery(params)}`);
  },
  async getProposal(id: string | number) {
    return apiFetch(`/proposals/${id}`);
  },
  async createProposal(data: any) {
    return apiFetch('/proposals', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateProposal(id: string | number, data: any) {
    return apiFetch(`/proposals/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteProposal(id: string | number) {
    return apiFetch(`/proposals/${id}`, { method: 'DELETE' });
  },
  async addActivity(id: string | number, data: any) {
    return apiFetch(`/proposals/${id}/activities`, { method: 'POST', body: JSON.stringify(data) });
  },
  async updateActivity(id: string | number, data: any) {
    return apiFetch(`/proposal-activities/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async addKpi(id: string | number, data: any) {
    return apiFetch(`/proposals/${id}/kpis`, { method: 'POST', body: JSON.stringify(data) });
  },
  async updateKpi(id: string | number, data: any) {
    return apiFetch(`/proposal-kpis/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async getAttachments(id: string | number) {
    return apiFetch(`/proposals/${id}/attachments`);
  },
  async uploadAttachment(id: string | number, formData: FormData) {
    return apiFetch(`/proposals/${id}/attachments`, { method: 'POST', body: formData, headers: {} });
  },
  async submit(id: string | number) {
    return apiFetch(`/proposals/${id}/submit`, { method: 'POST' });
  },
  async review(id: string | number) {
    return apiFetch(`/proposals/${id}/review`, { method: 'POST' });
  },
  async approve(id: string | number) {
    return apiFetch(`/proposals/${id}/approve`, { method: 'POST' });
  },
  async reject(id: string | number, reason: string) {
    return apiFetch(`/proposals/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
  },
  async publish(id: string | number) {
    return apiFetch(`/proposals/${id}/publish`, { method: 'POST' });
  },
  async close(id: string | number) {
    return apiFetch(`/proposals/${id}/close`, { method: 'POST' });
  },
};
