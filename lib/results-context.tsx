'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from './api-client';
import { registrationsApi } from './api';
import type {
  ExamResult,
  SemesterResult,
  CourseOffering,
  StudentProfile,
  GradeScale,
} from './college-types';
import { DEFAULT_GRADE_SCALE } from './college-types';

interface ResultsContextType {
  examResults: ExamResult[];
  semesterResults: SemesterResult[];
  courseOfferings: CourseOffering[];
  studentProfiles: StudentProfile[];
  loading: boolean;
  
  // Exam Results CRUD
  createExamResult: (data: any) => Promise<ExamResult>;
  getExamResults: (filters?: { studentProfileId?: string; academicYear?: string; semester?: string }) => Promise<ExamResult[]>;
  getExamResultById: (id: string) => Promise<ExamResult | null>;
  updateExamResult: (id: string, data: Partial<ExamResult>) => Promise<void>;
  deleteExamResult: (id: string) => Promise<void>;
  submitExamResult: (id: string) => Promise<void>;
  approveExamResult: (id: string) => Promise<void>;
  rejectExamResult: (id: string, reason: string) => Promise<void>;
  
  // Semester Results
  createSemesterResult: (data: any) => Promise<SemesterResult>;
  getSemesterResults: (studentProfileId?: string) => Promise<SemesterResult[]>;
  publishSemesterResult: (id: string) => Promise<void>;
  
  // Course Offerings
  getCourseOfferings: () => Promise<CourseOffering[]>;
  createCourseOffering: (data: any) => Promise<CourseOffering>;
  updateCourseOffering: (id: string, data: Partial<CourseOffering>) => Promise<void>;
  deleteCourseOffering: (id: string) => Promise<void>;
  
  // Student Profiles
  getStudentProfiles: () => Promise<StudentProfile[]>;
  getStudentProfileByRegistration: (registrationNumber: string) => Promise<StudentProfile | null>;
  updateStudentProfile: (id: string, data: Partial<StudentProfile>) => Promise<void>;
  deleteStudentProfile: (id: string) => Promise<void>;
  
  // Grade Calculation
  calculateGrade: (score: number) => { grade: GradeScale; points: number };
  calculateGPA: (results: ExamResult[]) => number;
  calculateCGPA: (semesterResults: SemesterResult[]) => number;
}

const ResultsContext = createContext<ResultsContextType | undefined>(undefined);

export function ResultsProvider({ children }: { children: React.ReactNode }) {
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [semesterResults, setSemesterResults] = useState<SemesterResult[]>([]);
  const [courseOfferings, setCourseOfferings] = useState<CourseOffering[]>([]);
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    loadCourseOfferings();
    loadStudentProfiles();
    loadExamResults();
    loadSemesterResults();
  }, []);

  const loadCourseOfferings = async () => {
    try {
      const response: any = await apiClient.getCourses();
      const rawData = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
      
      const realCourseOfferings: CourseOffering[] = rawData.map((course: any) => ({
        id: course.id.toString(),
        code: course.code || '',
        name: course.name || '',
        departmentId: course.department_id?.toString() || '',
        department: course.department?.name || 'N/A',
        credits: course.credits || 3,
        description: course.description || '',
        prerequisiteCourseIds: [],
        isActive: course.status === 'active' || course.is_active || true,
        createdAt: new Date(course.created_at || Date.now()),
      }));
      setCourseOfferings(realCourseOfferings);
    } catch (error) {
      console.error('Failed to load courses', error);
      setCourseOfferings([]);
    }
  };

  const loadStudentProfiles = async () => {
    try {
      const response: any = await apiClient.getRegistrations();
      const rawData = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
      
      // Include all non-rejected registrations so that pending/payment_completed students still show up if they have grades
      const approvedRegistrations = rawData.filter((r: any) => r.status !== 'rejected');
      
      const realStudentProfiles: StudentProfile[] = approvedRegistrations.map((reg: any) => ({
        id: reg.id.toString(), // The ID of the student profile (using registration ID)
        userId: reg.user_id?.toString() || '',
        studentName: reg.user ? `${reg.user.first_name} ${reg.user.last_name}` : (reg.first_name ? `${reg.first_name} ${reg.last_name}` : 'Unknown Student'),
        gender: reg.gender || reg.user?.gender || undefined,
        registrationId: reg.id.toString(),
        registrationNumber: reg.registration_number || `ZMS-26-01-${String(reg.user_id || reg.id).padStart(4, '0')}`,
        programId: reg.program_id?.toString() || '',
        programName: reg.program_name || reg.program?.name || 'Not Assigned',
        department: reg.department || 'N/A',
        intake: reg.intake || 'Main Intake',
        studyMode: reg.studyMode || 'full_time',
        currentYear: 1,
        currentSemester: 'first',
        currentAcademicYear: '2025/2026',
        gpa: 0.0,
        cgpa: 0.0,
        totalCreditsEarned: 0,
        status: 'active',
        createdAt: new Date(reg.createdAt || Date.now()),
        updatedAt: new Date(reg.updatedAt || Date.now()),
        // Add name fields since Student Registry page needs to display them
        firstName: reg.firstName,
        lastName: reg.lastName,
      }));
      setStudentProfiles(realStudentProfiles);
    } catch (error: any) {
      if (error?.message?.includes('Network Error')) {
        console.warn('Backend offline: Failed to load student profiles');
      } else {
        console.error('Failed to load real student profiles', error);
      }
      setStudentProfiles([]);
    }
  };

  const loadExamResults = async () => {
    setLoading(true);
    try {
      const data: any = await apiClient.getExamResults();
      const apiResults = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : []);
      
      const realExamResults: ExamResult[] = apiResults.map((r: any) => ({
        id: r.id?.toString() || `result-${Date.now()}-${Math.random()}`,
        studentProfileId: r.registration_id?.toString() || r.student_id?.toString() || '',
        registrationNumber: r.student?.registration_number || r.registration_number || (r.student_id ? `ZMS-26-01-${String(r.student_id).padStart(4, '0')}` : 'Unknown'),
        studentName: r.student ? `${r.student.first_name || ''} ${r.student.last_name || ''}`.trim() : (r.student_name || 'Unknown Student'),
        academicYear: r.course_offering?.academic_year || r.academic_year || '2024/2025',
        semester: r.course_offering?.semester || r.semester || 'first',
        courseOfferingId: r.course_offering?.course_id?.toString() || r.course_offering_id?.toString() || '',
        courseCode: r.course_offering?.course?.code || r.course_offering?.code || r.course_code || 'N/A',
        courseName: r.course_offering?.course?.name || r.course_offering?.name || r.course_name || 'Unknown Course',
        credits: r.course_offering?.course?.credits || r.course_offering?.credits || r.credits || 3,
        cat1Score: Number(r.cat1_score) || 0,
        cat2Score: Number(r.cat2_score) || 0,
        assignmentScore: Number(r.assignment_score) || 0,
        finalExamScore: Number(r.final_exam_score) || 0,
        totalScore: Number(r.total_score) || (Number(r.cat1_score || 0) + Number(r.cat2_score || 0) + Number(r.assignment_score || 0) + Number(r.final_exam_score || 0)),
        grade: r.grade || 'F',
        gradePoints: Number(r.gpa_points || r.grade_points) || 0.0,
        status: r.status || 'draft',
        instructorId: r.instructor_id?.toString() || 'inst-1',
        instructorName: r.instructor?.name || r.instructor_name || 'Instructor',
        submittedBy: r.submitted_by?.toString() || '',
        submittedAt: r.submitted_at ? new Date(r.submitted_at) : undefined,
        createdAt: r.created_at ? new Date(r.created_at) : new Date(),
        updatedAt: r.updated_at ? new Date(r.updated_at) : new Date(),
      }));
      setExamResults(realExamResults);
    } catch (error: any) {
      if (error?.message?.includes('Network Error')) {
        console.warn('Backend offline: Failed to load exam results');
      } else {
        console.error('Failed to load real exam results', error);
      }
      setExamResults([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSemesterResults = async () => {
    setLoading(true);
    // Mock data - replace with API call
    const mockSemesterResults: SemesterResult[] = [];
    setSemesterResults(mockSemesterResults);
    setLoading(false);
  };

  const calculateGrade = (score: number): { grade: GradeScale; points: number } => {
    const gradePoint = DEFAULT_GRADE_SCALE.find(
      (g) => score >= g.minScore && score <= g.maxScore
    );
    return {
      grade: gradePoint?.grade || 'F',
      points: gradePoint?.points || 0,
    };
  };

  const calculateGPA = (results: ExamResult[]): number => {
    if (results.length === 0) return 0;
    const totalPoints = results.reduce((sum, r) => sum + r.gradePoints * r.credits, 0);
    const totalCredits = results.reduce((sum, r) => sum + r.credits, 0);
    return totalCredits > 0 ? totalPoints / totalCredits : 0;
  };

  const calculateCGPA = (semesterResults: SemesterResult[]): number => {
    if (semesterResults.length === 0) return 0;
    const totalGPA = semesterResults.reduce((sum, r) => sum + r.semesterGPA, 0);
    return totalGPA / semesterResults.length;
  };

  const createExamResult = async (data: any): Promise<ExamResult> => {
    setLoading(true);
    
    try {
      await apiClient.createExamResult({
        student_id: parseInt(data.studentProfileId),
        course_offering_id: parseInt(data.courseOfferingId),
        cat1_score: data.cat1Score,
        cat2_score: data.cat2Score,
        assignment_score: data.assignmentScore,
        final_exam_score: data.finalExamScore,
      });
      await loadExamResults();
      // Return a dummy object to satisfy type, though actual object is in state now
      return examResults[examResults.length - 1] || {} as ExamResult;
    } catch (error) {
      console.error("Failed to create exam result", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getExamResults = async (filters?: {
    studentProfileId?: string;
    academicYear?: string;
    semester?: string;
  }): Promise<ExamResult[]> => {
    setLoading(true);
    let filtered = examResults;
    
    if (filters?.studentProfileId) {
      filtered = filtered.filter(r => r.studentProfileId === filters.studentProfileId);
    }
    if (filters?.academicYear) {
      filtered = filtered.filter(r => r.academicYear === filters.academicYear);
    }
    if (filters?.semester) {
      filtered = filtered.filter(r => r.semester === filters.semester);
    }
    
    setLoading(false);
    return filtered;
  };

  const getExamResultById = async (id: string): Promise<ExamResult | null> => {
    setLoading(true);
    const result = examResults.find(r => r.id === id) || null;
    setLoading(false);
    return result;
  };

  const updateExamResult = async (id: string, data: Partial<ExamResult>): Promise<void> => {
    setLoading(true);
    try {
      await apiClient.updateExamResult(id, {
        cat1_score: data.cat1Score,
        cat2_score: data.cat2Score,
        assignment_score: data.assignmentScore,
        final_exam_score: data.finalExamScore,
      });
      await loadExamResults();
    } catch (error) {
      console.error("Failed to update exam result", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteExamResult = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      await apiClient.deleteExamResult(id);
      await loadExamResults();
    } catch (error) {
      console.error("Failed to delete exam result", error);
      // Fallback
      setExamResults(prev => prev.filter(r => r.id !== id));
    } finally {
      setLoading(false);
    }
  };

  const submitExamResult = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      await apiClient.submitExamResult(id).catch(() => {});
      await loadExamResults();
    } catch (error) {
      console.error("Failed to submit result", error);
    } finally {
      setLoading(false);
    }
  };

  const approveExamResult = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      await apiClient.publishExamResult(id).catch(() => {});
      await loadExamResults();
    } catch (error) {
      console.error("Failed to approve result", error);
    } finally {
      setLoading(false);
    }
  };

  const rejectExamResult = async (id: string, reason: string): Promise<void> => {
    setLoading(true);
    await updateExamResult(id, { status: 'rejected', remarks: reason });
    setLoading(false);
  };

  const createSemesterResult = async (data: any): Promise<SemesterResult> => {
    setLoading(true);
    
    const studentResults = examResults.filter(
      r => r.studentProfileId === data.studentProfileId && 
           r.academicYear === data.academicYear && 
           r.semester === data.semester
    );
    
    const semesterGPA = calculateGPA(studentResults);
    
    const newSemesterResult: SemesterResult = {
      id: `semester-result-${Date.now()}`,
      studentProfileId: data.studentProfileId,
      registrationNumber: data.registrationNumber,
      studentName: data.studentName,
      programName: data.programName,
      department: data.department,
      
      academicYear: data.academicYear,
      semester: data.semester,
      
      totalCredits: studentResults.reduce((sum, r) => sum + r.credits, 0),
      semesterGPA,
      previousCGPA: data.previousCGPA || 0,
      newCGPA: data.previousCGPA ? ((data.previousCGPA + semesterGPA) / 2) : semesterGPA,
      
      status: 'unpublished',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setSemesterResults(prev => [...prev, newSemesterResult]);
    
    // Update student profile CGPA
    setStudentProfiles(prev => 
      prev.map(p => 
        p.id === data.studentProfileId 
          ? { ...p, cgpa: newSemesterResult.newCGPA, updatedAt: new Date() }
          : p
      )
    );
    
    setLoading(false);
    return newSemesterResult;
  };

  const getSemesterResults = async (studentProfileId?: string): Promise<SemesterResult[]> => {
    setLoading(true);
    let filtered = semesterResults;
    if (studentProfileId) {
      filtered = filtered.filter(r => r.studentProfileId === studentProfileId);
    }
    setLoading(false);
    return filtered;
  };

  const publishSemesterResult = async (id: string): Promise<void> => {
    setLoading(true);
    setSemesterResults(prev => 
      prev.map(r => 
        r.id === id 
          ? { ...r, status: 'published', publishedAt: new Date() }
          : r
      )
    );
    setLoading(false);
  };

  const getCourseOfferings = async (): Promise<CourseOffering[]> => {
    return courseOfferings;
  };

  const createCourseOffering = async (data: any): Promise<CourseOffering> => {
    const newCourse: CourseOffering = {
      id: `course-${Date.now()}`,
      code: data.code,
      name: data.name,
      departmentId: data.departmentId,
      department: data.department,
      credits: data.credits,
      description: data.description,
      prerequisiteCourseIds: data.prerequisiteCourseIds || [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setCourseOfferings(prev => [...prev, newCourse]);
    return newCourse;
  };

  const updateCourseOffering = async (id: string, data: Partial<CourseOffering>): Promise<void> => {
    setCourseOfferings(prev => 
      prev.map(c => c.id === id ? { ...c, ...data, updatedAt: new Date() } : c)
    );
  };

  const deleteCourseOffering = async (id: string): Promise<void> => {
    setCourseOfferings(prev => prev.filter(c => c.id !== id));
  };

  const getStudentProfiles = async (): Promise<StudentProfile[]> => {
    return studentProfiles;
  };

  const getStudentProfileByRegistration = async (registrationNumber: string): Promise<StudentProfile | null> => {
    return studentProfiles.find(p => p.registrationNumber === registrationNumber) || null;
  };

  const updateStudentProfile = async (id: string, data: Partial<StudentProfile>): Promise<void> => {
    setLoading(true);
    try {
      await registrationsApi.update(id, data);
      setStudentProfiles(prev => 
        prev.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date() } : p)
      );
    } catch (e) {
      console.error('Failed to update student profile', e);
      // Fallback optimistic update
      setStudentProfiles(prev => 
        prev.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date() } : p)
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteStudentProfile = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      await registrationsApi.delete(id);
      setStudentProfiles(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error('Failed to delete student profile', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResultsContext.Provider
      value={{
        examResults,
        semesterResults,
        courseOfferings,
        studentProfiles,
        loading,
        createExamResult,
        getExamResults,
        getExamResultById,
        updateExamResult,
        deleteExamResult,
        submitExamResult,
        approveExamResult,
        rejectExamResult,
        createSemesterResult,
        getSemesterResults,
        publishSemesterResult,
        getCourseOfferings,
        createCourseOffering,
        updateCourseOffering,
        deleteCourseOffering,
        getStudentProfiles,
        getStudentProfileByRegistration,
        updateStudentProfile,
        deleteStudentProfile,
        calculateGrade,
        calculateGPA,
        calculateCGPA,
      }}
    >
      {children}
    </ResultsContext.Provider>
  );
}

export function useResults() {
  const context = useContext(ResultsContext);
  if (context === undefined) {
    throw new Error('useResults must be used within a ResultsProvider');
  }
  return context;
}
