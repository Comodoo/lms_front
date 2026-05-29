'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from './api';
import { generateId } from './sample-data';

export type UserRole = 'student' | 'instructor' | 'admin' | 'accountant';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  password?: string;
  isVerified: boolean;
  verificationCode?: string;
  resetCode?: string;
  resetCodeExpiry?: Date;
  lastLogin?: Date;
  loginAttempts: number;
  isLocked: boolean;
  lockedUntil?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  courseReminders: boolean;
  weeklyDigest: boolean;
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  lowDataMode: boolean;
  autoplayVideos: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; requiresTwoFactor?: boolean }>;
  signup: (data: SignupData) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  confirmResetPassword: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  verifyEmail: (code: string) => Promise<{ success: boolean; message: string }>;
  resendVerification: () => Promise<{ success: boolean; message: string }>;
  updateProfile: (data: Partial<AuthUser>) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  deleteAccount: (password: string) => Promise<{ success: boolean; message: string }>;
  verifyTwoFactor: (code: string) => Promise<{ success: boolean; message: string }>;
  enableTwoFactor: () => Promise<{ success: boolean; secret?: string; qrCode?: string }>;
  disableTwoFactor: (code: string) => Promise<{ success: boolean; message: string }>;
  // Role-based access helpers
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isStudent: () => boolean;
  isInstructor: () => boolean;
  isAdmin: () => boolean;
  isAccountant: () => boolean;
  canAccessStudentRoutes: () => boolean;
  canAccessInstructorRoutes: () => boolean;
  canAccessAdminRoutes: () => boolean;
  canAccessAccountantRoutes: () => boolean;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  acceptTerms: boolean;
  adminCode?: string; // Required for admin signup
}

const defaultPreferences: UserPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  marketingEmails: false,
  courseReminders: true,
  weeklyDigest: true,
  language: 'en',
  timezone: 'Africa/Nairobi',
  theme: 'system',
  lowDataMode: false,
  autoplayVideos: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simulated user database
const DEMO_USERS: AuthUser[] = [
  {
    id: 'user-student-1',
    name: 'John Mwangi',
    email: 'student@example.com',
    role: 'student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    createdAt: new Date('2024-01-15'),
    password: 'password123',
    isVerified: true,
    loginAttempts: 0,
    isLocked: false,
    twoFactorEnabled: false,
    preferences: defaultPreferences,
  },
  {
    id: 'user-instructor-1',
    name: 'Dr. Sarah Ochieng',
    email: 'instructor@example.com',
    role: 'instructor',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    createdAt: new Date('2023-06-01'),
    password: 'password123',
    isVerified: true,
    loginAttempts: 0,
    isLocked: false,
    twoFactorEnabled: false,
    preferences: defaultPreferences,
  },
  {
    id: 'user-admin-1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    createdAt: new Date('2023-01-01'),
    password: 'admin123',
    isVerified: true,
    loginAttempts: 0,
    isLocked: false,
    twoFactorEnabled: false,
    preferences: defaultPreferences,
  },
  {
    id: 'user-accountant-1',
    name: 'Mary Johnson',
    email: 'accountant@example.com',
    role: 'accountant',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mary',
    createdAt: new Date('2023-02-01'),
    password: 'password123',
    isVerified: true,
    loginAttempts: 0,
    isLocked: false,
    twoFactorEnabled: false,
    preferences: defaultPreferences,
  },
];

// Admin registration code (for demo purposes)
const ADMIN_REGISTRATION_CODE = 'ADMIN2026';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<AuthUser[]>(DEMO_USERS);
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });
  const [pendingTwoFactorUser, setPendingTwoFactorUser] = useState<AuthUser | null>(null);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('lms-auth');
    const savedUsers = localStorage.getItem('lms-users');
    
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }
    
    if (savedAuth) {
      const parsed = JSON.parse(savedAuth);
      setState({
        user: parsed.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Save users to localStorage
  useEffect(() => {
    localStorage.setItem('lms-users', JSON.stringify(users));
  }, [users]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; message: string; requiresTwoFactor?: boolean; userRole?: string }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authApi.login(email, password);
      
      if (response.error) {
        setState(prev => ({ ...prev, isLoading: false, error: response.error }));
        return { success: false, message: response.error };
      }

      if (response.data) {
        const { token, user: backendUser } = response.data;
        
        // Store token in localStorage
        localStorage.setItem('auth_token', token);
        
        // Convert backend user to frontend format
        const authUser: AuthUser = {
          id: backendUser.id.toString(),
          name: `${backendUser.first_name} ${backendUser.last_name}`,
          email: backendUser.email,
          role: backendUser.role || 'student',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${backendUser.first_name}`,
          createdAt: new Date(backendUser.created_at || Date.now()),
          isVerified: true,
          loginAttempts: 0,
          isLocked: false,
          twoFactorEnabled: false,
          preferences: defaultPreferences,
        };

        setState({
          user: authUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        localStorage.setItem('lms-auth', JSON.stringify({ user: authUser }));
        return { success: true, message: 'Login successful', userRole: authUser.role };
      }
      
      setState(prev => ({ ...prev, isLoading: false, error: 'Invalid response from server' }));
      return { success: false, message: 'Invalid response from server' };
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false, error: 'Login failed' }));
      return { success: false, message: 'Login failed' };
    }
  }, []);

  const signup = useCallback(async (data: any): Promise<{ success: boolean; message: string }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authApi.register(data);
      
      if (response.error) {
        setState(prev => ({ ...prev, isLoading: false, error: response.error }));
        return { success: false, message: response.error };
      }

      // Do NOT log the user in automatically. Clear any tokens just in case
      localStorage.removeItem('auth_token');
      localStorage.removeItem('lms-auth');

      setState(prev => ({ ...prev, isLoading: false }));
      return { success: true, message: 'Account created successfully! Please log in.' };
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return { success: false, message: errorMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    // Call backend logout API
    await authApi.logout();
    
    // Clear local state
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    localStorage.removeItem('lms-auth');
    localStorage.removeItem('auth_token');
    setPendingTwoFactorUser(null);
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<{ success: boolean; message: string }> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      // Don't reveal if email exists
      return { success: true, message: 'If an account exists with this email, you will receive a password reset link.' };
    }

    const resetCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const resetCodeExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    setUsers(prev => prev.map(u => 
      u.id === user.id ? { ...u, resetCode, resetCodeExpiry } : u
    ));

    return { success: true, message: `Password reset code sent to ${email}. Code: ${resetCode} (shown for demo)` };
  }, [users]);

  const confirmResetPassword = useCallback(async (email: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user || user.resetCode !== code) {
      return { success: false, message: 'Invalid or expired reset code' };
    }

    if (user.resetCodeExpiry && new Date() > new Date(user.resetCodeExpiry)) {
      return { success: false, message: 'Reset code has expired. Please request a new one.' };
    }

    if (newPassword.length < 8) {
      return { success: false, message: 'Password must be at least 8 characters' };
    }

    setUsers(prev => prev.map(u => 
      u.id === user.id ? { ...u, password: newPassword, resetCode: undefined, resetCodeExpiry: undefined } : u
    ));

    return { success: true, message: 'Password reset successful. You can now login with your new password.' };
  }, [users]);

  const verifyEmail = useCallback(async (code: string): Promise<{ success: boolean; message: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = users.find(u => u.verificationCode === code);
    
    if (!user) {
      return { success: false, message: 'Invalid verification code' };
    }

    setUsers(prev => prev.map(u => 
      u.id === user.id ? { ...u, isVerified: true, verificationCode: undefined } : u
    ));

    return { success: true, message: 'Email verified successfully!' };
  }, [users]);

  const resendVerification = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!state.user) {
      return { success: false, message: 'Not logged in' };
    }

    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    setUsers(prev => prev.map(u => 
      u.id === state.user?.id ? { ...u, verificationCode: newCode } : u
    ));

    return { success: true, message: `New verification code sent: ${newCode} (shown for demo)` };
  }, [state.user]);

  const updateProfile = useCallback((data: Partial<AuthUser>) => {
    if (!state.user) return;

    const updatedUser = { ...state.user, ...data };
    
    setUsers(prev => prev.map(u => u.id === state.user?.id ? updatedUser : u));
    setState(prev => ({ ...prev, user: updatedUser }));
    localStorage.setItem('lms-auth', JSON.stringify({ user: updatedUser }));
  }, [state.user]);

  const updatePreferences = useCallback((prefs: Partial<UserPreferences>) => {
    if (!state.user) return;

    const updatedUser = { 
      ...state.user, 
      preferences: { ...state.user.preferences, ...prefs } 
    };
    
    setUsers(prev => prev.map(u => u.id === state.user?.id ? updatedUser : u));
    setState(prev => ({ ...prev, user: updatedUser }));
    localStorage.setItem('lms-auth', JSON.stringify({ user: updatedUser }));
  }, [state.user]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!state.user) {
      return { success: false, message: 'Not logged in' };
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const user = users.find(u => u.id === state.user?.id);
    
    if (!user || user.password !== currentPassword) {
      return { success: false, message: 'Current password is incorrect' };
    }

    if (newPassword.length < 8) {
      return { success: false, message: 'New password must be at least 8 characters' };
    }

    setUsers(prev => prev.map(u => 
      u.id === state.user?.id ? { ...u, password: newPassword } : u
    ));

    return { success: true, message: 'Password changed successfully' };
  }, [state.user, users]);

  const deleteAccount = useCallback(async (password: string): Promise<{ success: boolean; message: string }> => {
    if (!state.user) {
      return { success: false, message: 'Not logged in' };
    }

    const user = users.find(u => u.id === state.user?.id);
    
    if (!user || user.password !== password) {
      return { success: false, message: 'Password is incorrect' };
    }

    setUsers(prev => prev.filter(u => u.id !== state.user?.id));
    logout();

    return { success: true, message: 'Account deleted successfully' };
  }, [state.user, users, logout]);

  const verifyTwoFactor = useCallback(async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!pendingTwoFactorUser) {
      return { success: false, message: 'No pending two-factor authentication' };
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // Simple verification for demo (in production, use proper TOTP)
    if (code === '123456') {
      const updatedUser = { ...pendingTwoFactorUser, loginAttempts: 0, lastLogin: new Date() };
      
      setState({
        user: updatedUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      localStorage.setItem('lms-auth', JSON.stringify({ user: updatedUser }));
      setPendingTwoFactorUser(null);

      return { success: true, message: 'Two-factor authentication successful' };
    }

    return { success: false, message: 'Invalid verification code' };
  }, [pendingTwoFactorUser]);

  const enableTwoFactor = useCallback(async (): Promise<{ success: boolean; secret?: string; qrCode?: string }> => {
    if (!state.user) {
      return { success: false };
    }

    // Generate a mock secret and QR code
    const secret = 'JBSWY3DPEHPK3PXP'; // Demo secret
    const qrCode = `otpauth://totp/LMS:${state.user.email}?secret=${secret}&issuer=LMS`;

    const updatedUser = { ...state.user, twoFactorSecret: secret };
    setUsers(prev => prev.map(u => u.id === state.user?.id ? updatedUser : u));

    return { success: true, secret, qrCode };
  }, [state.user]);

  const disableTwoFactor = useCallback(async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!state.user) {
      return { success: false, message: 'Not logged in' };
    }

    if (code !== '123456') {
      return { success: false, message: 'Invalid verification code' };
    }

    const updatedUser = { ...state.user, twoFactorEnabled: false, twoFactorSecret: undefined };
    
    setUsers(prev => prev.map(u => u.id === state.user?.id ? updatedUser : u));
    setState(prev => ({ ...prev, user: updatedUser }));
    localStorage.setItem('lms-auth', JSON.stringify({ user: updatedUser }));

    return { success: true, message: 'Two-factor authentication disabled' };
  }, [state.user]);

  // Role-based access helpers
  const hasRole = useCallback((role: UserRole): boolean => {
    return state.user?.role === role;
  }, [state.user]);

  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    return state.user?.role ? roles.includes(state.user.role) : false;
  }, [state.user]);

  const isStudent = useCallback((): boolean => {
    return state.user?.role === 'student';
  }, [state.user]);

  const isInstructor = useCallback((): boolean => {
    return state.user?.role === 'instructor';
  }, [state.user]);

  const isAdmin = useCallback((): boolean => {
    return state.user?.role === 'admin';
  }, [state.user]);

  const isAccountant = useCallback((): boolean => {
    return state.user?.role === 'accountant';
  }, [state.user]);

  const canAccessStudentRoutes = useCallback((): boolean => {
    return state.user?.role === 'student';
  }, [state.user]);

  const canAccessInstructorRoutes = useCallback((): boolean => {
    return state.user?.role === 'instructor' || state.user?.role === 'admin';
  }, [state.user]);

  const canAccessAdminRoutes = useCallback((): boolean => {
    return state.user?.role === 'admin';
  }, [state.user]);

  const canAccessAccountantRoutes = useCallback((): boolean => {
    return state.user?.role === 'accountant' || state.user?.role === 'admin';
  }, [state.user]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        signup,
        logout,
        resetPassword,
        confirmResetPassword,
        verifyEmail,
        resendVerification,
        updateProfile,
        updatePreferences,
        changePassword,
        deleteAccount,
        verifyTwoFactor,
        enableTwoFactor,
        disableTwoFactor,
        hasRole,
        hasAnyRole,
        isStudent,
        isInstructor,
        isAdmin,
        isAccountant,
        canAccessStudentRoutes,
        canAccessInstructorRoutes,
        canAccessAdminRoutes,
        canAccessAccountantRoutes,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
