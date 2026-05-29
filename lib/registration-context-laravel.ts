/**
 * Registration Context - Laravel API Integration
 * 
 * This is an updated version of the registration context that connects
 * to the Laravel backend API instead of using local storage.
 * 
 * To use this:
 * 1. Replace the contents of lib/registration-context.tsx with this file
 * 2. Or import this as a separate context and switch between them
 */

'use client';

import { apiClient } from '@/lib/api-client';
import {
  AcademicQualification,
  FeeType,
  Program,
  RegistrationFormData,
  RegistrationPayment,
  StudentRegistration,
} from '@/lib/college-types';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface RegistrationContextType {
  registrations: StudentRegistration[];
  programs: Program[];
  departments: any[];
  loading: boolean;
  error: string | null;
  createRegistration: (data: RegistrationFormData) => Promise<StudentRegistration>;
  getRegistrationById: (id: string) => Promise<StudentRegistration | null>;
  uploadDocument: (registrationId: string, file: File, type: string) => Promise<void>;
  processPayment: (
    registrationId: string,
    feeType: FeeType,
    method: 'mpesa' | 'card' | 'bank_transfer' | 'cash',
    phoneNumber?: string
  ) => Promise<RegistrationPayment>;
  fetchPrograms: () => Promise<void>;
  fetchDepartments: () => Promise<void>;
  fetchRegistrations: () => Promise<void>;
  approveRegistration: (id: string) => Promise<void>;
  rejectRegistration: (id: string, reason: string) => Promise<void>;
}

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export function LaravelRegistrationProvider({ children }: { children: React.ReactNode }) {
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch programs from API
  const fetchPrograms = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getPrograms();
      // Transform Laravel data to frontend format
      const transformedPrograms: Program[] = data.map((p: any) => ({
        id: String(p.id),
        name: p.name,
        code: p.code,
        department: p.department?.name || '',
        departmentId: String(p.department_id),
        duration: p.duration,
        description: p.description || '',
        requirements: p.requirements || [],
        tuitionFee: p.tuition_fee,
        currency: p.currency,
      }));
      setPrograms(transformedPrograms);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch programs');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch departments from API
  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getDepartments();
      setDepartments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch registrations from API
  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getRegistrations();
      // Transform Laravel data to frontend format
      const transformedRegistrations: StudentRegistration[] = data.map((r: any) => ({
        id: String(r.id),
        userId: String(r.user_id),
        registrationNumber: r.registration_number,
        status: r.status,
        
        // Personal Information
        firstName: r.first_name,
        lastName: r.last_name,
        dateOfBirth: r.date_of_birth,
        gender: r.gender,
        nationalId: r.national_id,
        nationalIdType: r.national_id_type,
        nationalIdExpiryDate: r.national_id_expiry_date,
        phone: r.phone,
        email: r.email,
        address: r.address,
        city: r.city,
        country: r.country,
        
        // Academic Qualifications
        academicQualifications: r.academic_qualifications?.map((aq: any) => ({
          id: String(aq.id),
          level: aq.level,
          institutionName: aq.institution_name,
          institutionAddress: aq.institution_address,
          country: aq.country,
          startDate: aq.start_date,
          endDate: aq.end_date,
          examinationBoard: aq.examination_board,
          indexNumber: aq.index_number,
          grade: aq.grade,
          gpa: aq.gpa,
          major: aq.major,
          documentId: aq.document_path,
        })) || [],
        
        // Program Information
        programId: String(r.program_id),
        programName: r.program_name,
        department: r.department,
        intake: r.intake,
        studyMode: r.study_mode,
        
        // Guardian Information
        guardianName: r.guardian_name,
        guardianPhone: r.guardian_phone,
        guardianEmail: r.guardian_email,
        guardianRelationship: r.guardian_relationship,
        guardianAddress: r.guardian_address,
        
        // Documents & Payments
        documents: r.documents?.map((d: any) => ({
          id: String(d.id),
          type: d.type,
          name: d.original_name,
          url: d.file_path,
          status: d.status,
          uploadedAt: d.created_at,
        })) || [],
        
        payments: r.payments?.map((p: any) => ({
          id: String(p.id),
          registrationId: String(p.registration_id),
          feeType: p.fee_type,
          description: p.description,
          amount: p.amount,
          currency: p.currency,
          controlNumber: p.control_number,
          method: p.method,
          status: p.status,
          paidAt: p.paid_at,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        })) || [],
        
        rejectionReason: r.rejection_reason,
        submittedAt: r.submitted_at,
        approvedAt: r.approved_at,
        reviewedAt: r.reviewed_at,
      }));
      setRegistrations(transformedRegistrations);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch registrations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get registration by ID
  const getRegistrationById = useCallback(async (id: string): Promise<StudentRegistration | null> => {
    try {
      setLoading(true);
      const r = await apiClient.getRegistration(id);
      
      // Transform to frontend format (same as above)
      const registration: StudentRegistration = {
        id: String(r.id),
        userId: String(r.user_id),
        registrationNumber: r.registration_number,
        status: r.status,
        firstName: r.first_name,
        lastName: r.last_name,
        dateOfBirth: r.date_of_birth,
        gender: r.gender,
        nationalId: r.national_id,
        nationalIdType: r.national_id_type,
        nationalIdExpiryDate: r.national_id_expiry_date,
        phone: r.phone,
        email: r.email,
        address: r.address,
        city: r.city,
        country: r.country,
        academicQualifications: r.academic_qualifications?.map((aq: any) => ({
          id: String(aq.id),
          level: aq.level,
          institutionName: aq.institution_name,
          institutionAddress: aq.institution_address,
          country: aq.country,
          startDate: aq.start_date,
          endDate: aq.end_date,
          examinationBoard: aq.examination_board,
          indexNumber: aq.index_number,
          grade: aq.grade,
          gpa: aq.gpa,
          major: aq.major,
          documentId: aq.document_path,
        })) || [],
        programId: String(r.program_id),
        programName: r.program_name,
        department: r.department,
        intake: r.intake,
        studyMode: r.study_mode,
        guardianName: r.guardian_name,
        guardianPhone: r.guardian_phone,
        guardianEmail: r.guardian_email,
        guardianRelationship: r.guardian_relationship,
        guardianAddress: r.guardian_address,
        documents: r.documents?.map((d: any) => ({
          id: String(d.id),
          type: d.type,
          name: d.original_name,
          url: d.file_path,
          status: d.status,
          uploadedAt: d.created_at,
        })) || [],
        payments: r.payments?.map((p: any) => ({
          id: String(p.id),
          registrationId: String(p.registration_id),
          feeType: p.fee_type,
          description: p.description,
          amount: p.amount,
          currency: p.currency,
          controlNumber: p.control_number,
          method: p.method,
          status: p.status,
          paidAt: p.paid_at,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        })) || [],
        rejectionReason: r.rejection_reason,
        submittedAt: r.submitted_at,
        approvedAt: r.approved_at,
        reviewedAt: r.reviewed_at,
      };
      
      return registration;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch registration');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create registration
  const createRegistration = useCallback(async (
    data: RegistrationFormData
  ): Promise<StudentRegistration> => {
    try {
      setLoading(true);
      
      // Transform frontend data to Laravel format
      const apiData = {
        first_name: data.firstName,
        last_name: data.lastName,
        date_of_birth: data.dateOfBirth,
        gender: data.gender,
        national_id: data.nationalId,
        national_id_type: data.nationalIdType,
        national_id_expiry_date: data.nationalIdExpiryDate,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        country: data.country,
        academic_qualifications: data.academicQualifications.map((aq) => ({
          level: aq.level,
          institution_name: aq.institutionName,
          institution_address: aq.institutionAddress,
          country: aq.country,
          start_date: aq.startDate,
          end_date: aq.endDate,
          examination_board: aq.examinationBoard,
          index_number: aq.indexNumber,
          grade: aq.grade,
          gpa: aq.gpa ? parseFloat(aq.gpa) : null,
          major: aq.major,
        })),
        program_id: parseInt(data.programId),
        intake: data.intake,
        study_mode: data.studyMode,
        guardian_name: data.guardianName,
        guardian_phone: data.guardianPhone,
        guardian_email: data.guardianEmail,
        guardian_relationship: data.guardianRelationship,
        guardian_address: data.guardianAddress,
        documents: data.documents,
      };

      const response = await apiClient.createRegistration(apiData);
      
      // Refresh registrations list
      await fetchRegistrations();
      
      return response.registration;
    } catch (err: any) {
      setError(err.message || 'Failed to create registration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchRegistrations]);

  // Upload document
  const uploadDocument = useCallback(async (
    registrationId: string,
    file: File,
    type: string
  ): Promise<void> => {
    try {
      setLoading(true);
      // Document upload is handled during registration creation
      // For standalone uploads, you'd need a separate endpoint
      console.log('Document upload for registration', registrationId, file, type);
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Process payment
  const processPayment = useCallback(async (
    registrationId: string,
    feeType: FeeType,
    method: 'mpesa' | 'card' | 'bank_transfer' | 'cash',
    phoneNumber?: string
  ): Promise<RegistrationPayment> => {
    try {
      setLoading(true);
      
      const response = await apiClient.processPayment({
        registration_id: parseInt(registrationId),
        fee_type: feeType,
        method: method,
        phone_number: phoneNumber,
      });
      
      // Refresh registrations to get updated payments
      await fetchRegistrations();
      
      return {
        id: String(response.payment.id),
        registrationId: String(response.payment.registration_id),
        feeType: response.payment.fee_type,
        description: response.payment.description,
        amount: response.payment.amount,
        currency: response.payment.currency,
        controlNumber: response.payment.control_number,
        method: response.payment.method,
        status: response.payment.status,
        paidAt: response.payment.paid_at,
        createdAt: response.payment.created_at,
        updatedAt: response.payment.updated_at,
      };
    } catch (err: any) {
      setError(err.message || 'Failed to process payment');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchRegistrations]);

  // Approve registration (admin)
  const approveRegistration = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      await apiClient.approveRegistration(id);
      await fetchRegistrations();
    } catch (err: any) {
      setError(err.message || 'Failed to approve registration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchRegistrations]);

  // Reject registration (admin)
  const rejectRegistration = useCallback(async (id: string, reason: string): Promise<void> => {
    try {
      setLoading(true);
      await apiClient.rejectRegistration(id, reason);
      await fetchRegistrations();
    } catch (err: any) {
      setError(err.message || 'Failed to reject registration');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchRegistrations]);

  // Load initial data
  useEffect(() => {
    fetchPrograms();
    fetchDepartments();
    fetchRegistrations();
  }, [fetchPrograms, fetchDepartments, fetchRegistrations]);

  const value: RegistrationContextType = {
    registrations,
    programs,
    departments,
    loading,
    error,
    createRegistration,
    getRegistrationById,
    uploadDocument,
    processPayment,
    fetchPrograms,
    fetchDepartments,
    fetchRegistrations,
    approveRegistration,
    rejectRegistration,
  };

  return (
    <RegistrationContext.Provider value={value}>
      {children}
    </RegistrationContext.Provider>
  );
}

export function useLaravelRegistration() {
  const context = useContext(RegistrationContext);
  if (context === undefined) {
    throw new Error('useLaravelRegistration must be used within a LaravelRegistrationProvider');
  }
  return context;
}

export { RegistrationContext };
