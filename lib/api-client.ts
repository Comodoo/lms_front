/**
 * API Client for Laravel Backend Integration
 * 
 * This client connects the Next.js frontend to the Laravel backend API.
 * Base URL: http://localhost:8000/api
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Token storage
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

const setToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
};

const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
};

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
    credentials: 'include',
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (error: any) {
    console.warn(`[API Client] Network error when fetching ${endpoint}:`, error.message);
    throw new Error(`Network Error: Failed to connect to backend. Is the server running?`);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    // Handle unauthenticated error specially - don't throw for 401 if no token exists
    if (response.status === 401) {
      const token = getToken();
      if (!token) {
        // No token, user not logged in - return empty data instead of throwing
        return {} as T;
      }
    }
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// ==================== AUTHENTICATION ====================

export async function register(data: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
}) {
  const response = await apiRequest<{
    user: any;
    token: string;
    token_type: string;
  }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  setToken(response.token);
  return response;
}

export async function login(email: string, password: string) {
  const response = await apiRequest<{
    user: any;
    token: string;
    token_type: string;
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  setToken(response.token);
  return response;
}

export async function logout() {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } finally {
    removeToken();
  }
}

export async function getCurrentUser() {
  return apiRequest('/auth/profile');
}

export async function updateProfile(data: {
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
}) {
  return apiRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ==================== PROGRAMS ====================

export async function getPrograms(departmentId?: number) {
  const params = departmentId ? `?department_id=${departmentId}` : '';
  return apiRequest(`/programs${params}`);
}

export async function getProgram(id: number) {
  return apiRequest(`/programs/${id}`);
}

export async function getDepartments() {
  return apiRequest('/departments');
}

// ==================== FEES ====================

export async function getFees(programId?: number | string, all: boolean = false) {
  const queryParams = new URLSearchParams();
  if (programId) queryParams.append('program_id', String(programId));
  if (all) queryParams.append('all', 'true');
  
  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return apiRequest(`/fees${query}`);
}

export async function createFee(data: any) {
  return apiRequest('/fees', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateFee(id: number | string, data: any) {
  return apiRequest(`/fees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteFee(id: number | string) {
  return apiRequest(`/fees/${id}`, { method: 'DELETE' });
}

export async function createProgram(data: any) {
  return apiRequest('/programs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProgram(id: number | string, data: any) {
  return apiRequest(`/programs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProgram(id: number | string) {
  return apiRequest(`/programs/${id}`, { method: 'DELETE' });
}

// ==================== REGISTRATIONS ====================

export async function getRegistrations(status?: string) {
  const params = status ? `?status=${status}` : '';
  const data = await apiRequest<any[]>(`/registrations${params}`);
  
  if (!Array.isArray(data)) {
    return [];
  }
  
  return data.map(reg => ({
    ...reg,
    firstName: reg.first_name,
    lastName: reg.last_name,
    dateOfBirth: reg.date_of_birth,
    nationalId: reg.national_id,
    nationalIdType: reg.national_id_type,
    nationalIdExpiryDate: reg.national_id_expiry_date,
    programId: reg.program_id,
    programName: reg.program_name,
    studyMode: reg.study_mode,
    guardianName: reg.guardian_name,
    guardianPhone: reg.guardian_phone,
    guardianEmail: reg.guardian_email,
    guardianRelationship: reg.guardian_relationship,
    guardianAddress: reg.guardian_address,
    registrationNumber: reg.registration_number,
    submittedAt: reg.submitted_at,
    approvedAt: reg.approved_at,
    academicQualifications: reg.academic_qualifications?.map((q: any) => ({
      ...q,
      institutionName: q.institution_name,
      institutionAddress: q.institution_address,
      startDate: q.start_date,
      endDate: q.end_date,
      examinationBoard: q.examination_board,
      indexNumber: q.index_number,
    }))
  }));
}

export async function getRegistration(id: number | string) {
  const reg = await apiRequest<any>(`/registrations/${id}`);
  if (!reg || !reg.id) return reg;
  return {
    ...reg,
    firstName: reg.first_name,
    lastName: reg.last_name,
    dateOfBirth: reg.date_of_birth,
    nationalId: reg.national_id,
    nationalIdType: reg.national_id_type,
    nationalIdExpiryDate: reg.national_id_expiry_date,
    programId: reg.program_id,
    programName: reg.program_name,
    studyMode: reg.study_mode,
    guardianName: reg.guardian_name,
    guardianPhone: reg.guardian_phone,
    guardianEmail: reg.guardian_email,
    guardianRelationship: reg.guardian_relationship,
    guardianAddress: reg.guardian_address,
    registrationNumber: reg.registration_number,
    submittedAt: reg.submitted_at,
    approvedAt: reg.approved_at,
    academicQualifications: reg.academic_qualifications?.map((q: any) => ({
      ...q,
      institutionName: q.institution_name,
      institutionAddress: q.institution_address,
      startDate: q.start_date,
      endDate: q.end_date,
      examinationBoard: q.examination_board,
      indexNumber: q.index_number,
    }))
  };
}

export async function createRegistration(data: {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  national_id: string;
  national_id_type?: 'passport' | 'national_id' | 'birth_certificate';
  national_id_expiry_date?: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  academic_qualifications: Array<{
    level: 'o_level' | 'a_level' | 'certificate' | 'diploma' | 'degree' | 'other';
    institution_name: string;
    institution_address: string;
    country: string;
    start_date: string;
    end_date: string;
    examination_board?: string;
    index_number?: string;
    grade?: string;
    gpa?: number;
    major?: string;
  }>;
  program_id: number;
  intake: string;
  study_mode: 'full_time' | 'part_time' | 'distance_learning';
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
  guardian_relationship: string;
  guardian_address: string;
  documents?: File[];
}) {
  // If there are files, use FormData
  if (data.documents && data.documents.length > 0) {
    const formData = new FormData();

    // Add all text fields
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'documents' && key !== 'academic_qualifications') {
        formData.append(key, String(value));
      }
    });

    // Add academic qualifications as JSON
    formData.append('academic_qualifications', JSON.stringify(data.academic_qualifications));

    // Add files
    data.documents.forEach((file) => {
      formData.append('documents[]', file);
    });

    return apiRequest('/registrations', {
      method: 'POST',
      body: formData as any,
      headers: {}, // Let browser set content-type for FormData
    });
  }

  return apiRequest('/registrations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function approveRegistration(id: number | string) {
  return apiRequest(`/registrations/${id}/approve`, { method: 'POST' });
}

export async function rejectRegistration(id: number | string, reason: string) {
  return apiRequest(`/registrations/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// ==================== PAYMENTS ====================

export async function getPayments(params?: { status?: string; registration_id?: number }) {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.registration_id) queryParams.append('registration_id', String(params.registration_id));

  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return apiRequest(`/payments${query}`);
}

export async function getPayment(id: number | string) {
  return apiRequest(`/payments/${id}`);
}

export async function processPayment(data: {
  registration_id: number;
  fee_type: 'registration_fee' | 'tuition_fee' | 'library_fee' | 'laboratory_fee' | 'examination_fee' | 'hostel_fee' | 'other';
  method: 'mpesa' | 'card' | 'bank_transfer' | 'cash';
  phone_number?: string;
}) {
  return apiRequest('/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function verifyCashPayment(id: number | string) {
  return apiRequest(`/payments/${id}/verify-cash`, { method: 'POST' });
}

export async function getPaymentsByRegistration(registrationId: number | string) {
  const data = await apiRequest<any[]>(`/registrations/${registrationId}/payments`);
  
  if (!Array.isArray(data)) {
    return [];
  }
  
  return data.map(payment => ({
    ...payment,
    feeType: payment.fee_type,
    controlNumber: payment.control_number,
    transactionId: payment.transaction_id,
    failureReason: payment.failure_reason,
    paidAt: payment.paid_at,
    processedBy: payment.processed_by,
  }));
}

// ==================== EXAM RESULTS ====================

export async function getExamResults(params?: {
  student_id?: number;
  course_offering_id?: number;
  status?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.student_id) queryParams.append('student_id', String(params.student_id));
  if (params?.course_offering_id) queryParams.append('course_offering_id', String(params.course_offering_id));
  if (params?.status) queryParams.append('status', params.status);

  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return apiRequest(`/exam-results${query}`);
}

export async function getExamResult(id: number | string) {
  return apiRequest(`/exam-results/${id}`);
}

export async function createExamResult(data: {
  student_id: number;
  course_offering_id: number;
  cat1_score?: number;
  cat2_score?: number;
  assignment_score?: number;
  final_exam_score: number;
  remarks?: string;
}) {
  return apiRequest('/exam-results', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateExamResult(id: number | string, data: {
  cat1_score?: number;
  cat2_score?: number;
  assignment_score?: number;
  final_exam_score?: number;
  remarks?: string;
}) {
  return apiRequest(`/exam-results/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteExamResult(id: number | string) {
  return apiRequest(`/exam-results/${id}`, { method: 'DELETE' });
}

export async function publishExamResult(id: number | string) {
  return apiRequest(`/exam-results/${id}/publish`, { method: 'POST' });
}

export async function submitExamResult(id: number | string) {
  return apiRequest(`/exam-results/${id}/submit`, { method: 'POST' });
}

export async function getStudentResults(studentId?: number | string) {
  if (studentId) {
    return apiRequest(`/students/${studentId}/results`);
  }
  return apiRequest('/student-results');
}

export async function getCourseResults(courseOfferingId: number | string) {
  return apiRequest(`/course-offerings/${courseOfferingId}/results`);
}

// ==================== COURSES ====================

export async function getCourses() {
  return apiRequest('/courses');
}

// ==================== DASHBOARD ====================

export async function getDashboardStats() {
  return apiRequest('/dashboard/stats');
}

// ==================== EXPORT ====================

export const apiClient = {
  // Auth
  register,
  login,
  logout,
  getCurrentUser,
  updateProfile,

  // Programs
  getPrograms,
  getProgram,
  createProgram,
  updateProgram,
  deleteProgram,
  getDepartments,

  // Fees
  getFees,
  createFee,
  updateFee,
  deleteFee,

  // Registrations
  getRegistrations,
  getRegistration,
  createRegistration,
  approveRegistration,
  rejectRegistration,

  // Payments
  getPayments,
  getPayment,
  processPayment,
  verifyCashPayment,
  getPaymentsByRegistration,

  // Exam Results
  getExamResults,
  getExamResult,
  createExamResult,
  updateExamResult,
  deleteExamResult,
  submitExamResult,
  publishExamResult,
  getStudentResults,
  getCourseResults,

  // Courses
  getCourses,

  // Dashboard
  getDashboardStats,
};

export default apiClient;
