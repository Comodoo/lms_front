'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from './api-client';
import { registrationsApi } from './api';
import { useAuth } from './auth-context';
import {
    Department,
    FeeType,
    PaymentMethod,
    Program,
    RegistrationDocument,
    RegistrationFormData,
    RegistrationPayment,
    RegistrationStatus,
    StudentRegistration
} from './college-types';

interface RegistrationContextType {
  registrations: StudentRegistration[];
  programs: Program[];
  departments: Department[];
  currentRegistration: StudentRegistration | null;
  loading: boolean;
  
  // CRUD Operations
  createRegistration: (data: RegistrationFormData) => Promise<StudentRegistration>;
  getRegistrations: (filters?: { status?: RegistrationStatus }) => Promise<StudentRegistration[]>;
  getRegistrationById: (id: string) => Promise<StudentRegistration | null>;
  updateRegistration: (id: string, data: Partial<StudentRegistration>) => Promise<void>;
  deleteRegistration: (id: string) => Promise<void>;
  approveRegistration: (id: string) => Promise<void>;
  rejectRegistration: (id: string, reason: string) => Promise<void>;
  
  // Payment Operations
  processPayment: (registrationId: string, feeType: FeeType, method: PaymentMethod, phoneNumber?: string) => Promise<RegistrationPayment>;
  
  // Document Operations
  uploadDocument: (registrationId: string, type: string, file: File) => Promise<RegistrationDocument>;
  
  // Helper
  setCurrentRegistration: (registration: StudentRegistration | null) => void;
}

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export function RegistrationProvider({ children }: { children: React.ReactNode }) {
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [currentRegistration, setCurrentRegistration] = useState<StudentRegistration | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if user is authenticated before loading data
  const auth = useAuth();
  const isAuthenticated = auth?.isAuthenticated ?? false;

  // Load initial data only when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadPrograms();
      loadDepartments();
      loadRegistrations();
    }
  }, [isAuthenticated]);

  const loadPrograms = async () => {
    try {
      const data = await apiClient.getPrograms();
      setPrograms(data as Program[]);
    } catch (error: any) {
      if (error?.message?.includes('Unauthenticated')) return;
      if (error?.message?.includes('Network Error')) {
        console.warn('Backend offline: Failed to load programs');
        return;
      }
      console.error('Failed to load programs:', error);
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await apiClient.getDepartments();
      setDepartments(data as Department[]);
    } catch (error: any) {
      if (error?.message?.includes('Unauthenticated')) return;
      if (error?.message?.includes('Network Error')) {
        console.warn('Backend offline: Failed to load departments');
        return;
      }
      console.error('Failed to load departments:', error);
    }
  };

  const loadRegistrations = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getRegistrations();
      setRegistrations(data);
    } catch (error: any) {
      if (error?.message?.includes('Unauthenticated')) {
        setRegistrations([]);
        return;
      }
      if (error?.message?.includes('Network Error')) {
        console.warn('Backend offline: Failed to load registrations');
        setRegistrations([]);
        return;
      }
      console.error('Failed to load registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRegistration = async (data: RegistrationFormData): Promise<StudentRegistration> => {
    setLoading(true);
    try {
      const formData = new FormData();
      
      // Basic Fields
      formData.append('first_name', data.firstName);
      formData.append('last_name', data.lastName);
      formData.append('date_of_birth', data.dateOfBirth);
      formData.append('gender', data.gender);
      formData.append('national_id', data.nationalId);
      formData.append('national_id_type', data.nationalIdType || 'national_id');
      if (data.nationalIdExpiryDate) formData.append('national_id_expiry_date', data.nationalIdExpiryDate);
      formData.append('phone', data.phone);
      formData.append('email', data.email);
      formData.append('address', data.address);
      formData.append('city', data.city);
      formData.append('country', data.country);
      formData.append('program_id', data.programId.replace('prog-', ''));
      formData.append('intake', data.intake);
      formData.append('study_mode', data.studyMode);
      formData.append('guardian_name', data.guardianName);
      formData.append('guardian_phone', data.guardianPhone);
      if (data.guardianEmail) formData.append('guardian_email', data.guardianEmail);
      formData.append('guardian_relationship', data.guardianRelationship);
      formData.append('guardian_address', data.guardianAddress);

      // Academic Qualifications
      data.academicQualifications.forEach((q: any, i: number) => {
        formData.append(`academic_qualifications[${i}][level]`, q.level);
        formData.append(`academic_qualifications[${i}][institution_name]`, q.institutionName);
        formData.append(`academic_qualifications[${i}][institution_address]`, q.institutionAddress);
        formData.append(`academic_qualifications[${i}][country]`, q.country);
        formData.append(`academic_qualifications[${i}][start_date]`, q.startDate);
        formData.append(`academic_qualifications[${i}][end_date]`, q.endDate);
        if (q.examinationBoard) formData.append(`academic_qualifications[${i}][examination_board]`, q.examinationBoard);
        if (q.indexNumber) formData.append(`academic_qualifications[${i}][index_number]`, q.indexNumber);
        if (q.grade) formData.append(`academic_qualifications[${i}][grade]`, q.grade);
        if (q.gpa) formData.append(`academic_qualifications[${i}][gpa]`, q.gpa);
        if (q.major) formData.append(`academic_qualifications[${i}][major]`, q.major);
        
        // Documents
        if (q.document) {
          formData.append('documents[]', q.document);
        }
      });

      // National ID Document
      if (data.nationalIdDocument) {
        formData.append('documents[]', data.nationalIdDocument);
      }

      const response = await registrationsApi.create(formData);
      
      if (response.error) {
        throw new Error(response.error);
      }

      const registration = (response.data as any)?.registration || (response.data as any);
      setRegistrations(prev => [registration, ...prev]);
      return registration;
    } finally {
      setLoading(false);
    }
  };

  const getRegistrations = async (filters?: { status?: RegistrationStatus }): Promise<StudentRegistration[]> => {
    setLoading(true);
    try {
      const data = await apiClient.getRegistrations(filters?.status);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const getRegistrationById = async (id: string): Promise<StudentRegistration | null> => {
    setLoading(true);
    try {
      return await apiClient.getRegistration(id);
    } catch (error: any) {
      if (!error?.message?.includes('Unauthorized') && !error?.message?.includes('status: 401')) {
        console.error('Failed to get registration:', error);
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateRegistration = async (id: string, data: Partial<StudentRegistration>): Promise<void> => {
    // Note: Backend might need a specific update endpoint
    console.warn('Update registration API not fully implemented in backend yet');
  };

  const deleteRegistration = async (id: string): Promise<void> => {
    // Note: Backend might need a specific delete endpoint
  };

  const approveRegistration = async (id: string): Promise<void> => {
    setLoading(true);
    try {
      await apiClient.approveRegistration(id);
      await loadRegistrations(); // Refresh list
    } finally {
      setLoading(false);
    }
  };

  const rejectRegistration = async (id: string, reason: string): Promise<void> => {
    setLoading(true);
    try {
      await apiClient.rejectRegistration(id, reason);
      await loadRegistrations(); // Refresh list
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (
    registrationId: string,
    feeType: FeeType,
    method: PaymentMethod,
    phoneNumber?: string
  ): Promise<RegistrationPayment> => {
    setLoading(true);
    try {
      const payment = await apiClient.processPayment({
        registration_id: parseInt(registrationId.replace('reg-', '')),
        fee_type: feeType,
        method: method,
        phone_number: phoneNumber
      });
      return payment as RegistrationPayment;
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (
    registrationId: string,
    type: string,
    file: File
  ): Promise<RegistrationDocument> => {
    // In this backend, documents are expected to be sent with the initial registration
    // or through a specific upload endpoint which we might need to add.
    // For now, let's assume successful mock if not explicitly handled.
    console.log(`Document upload requested for ${registrationId} of type ${type}`);
    return {
      id: `doc-${Date.now()}`,
      registrationId,
      type: type as any,
      name: file.name,
      url: '',
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date(),
      status: 'pending'
    };
  };

  return (
    <RegistrationContext.Provider
      value={{
        registrations,
        programs,
        departments,
        currentRegistration,
        loading,
        createRegistration,
        getRegistrations,
        getRegistrationById,
        updateRegistration,
        deleteRegistration,
        approveRegistration,
        rejectRegistration,
        processPayment,
        uploadDocument,
        setCurrentRegistration,
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
}

export function useRegistration() {
  const context = useContext(RegistrationContext);
  if (context === undefined) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
}
