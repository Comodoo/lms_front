'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { authApi, API_ERROR } from './api';
import {
  ADMIN_ENTRY_CODES,
  INSTRUCTOR_ENTRY_CODES,
  ACCOUNTANT_ENTRY_CODES,
  SUPER_ADMIN_CODE,
  normalizePermissionCodes,
} from './permissions';
import { generateId } from './sample-data';

export type UserRole = 'student' | 'instructor' | 'admin' | 'accountant';

/**
 * Where a user should land, derived from permissions alone.
 *
 * This is a pure function of an `AuthUser` rather than of component state on
 * purpose. The login handler needs to compute the destination from the profile
 * it just fetched; reading `user` out of the surrounding render instead would
 * hand back the *pre-login* value, because `setState` has not been committed
 * yet, and send an accountant to /dashboard.
 *
 * Order matters: a user with `*` goes to admin regardless of their portal role.
 */
export function landingPathFor(user: AuthUser | null): string {
  if (!user) return '/dashboard';

  const codes = new Set(user.permissions);
  if (codes.has(SUPER_ADMIN_CODE)) return '/admin';

  const has = (list: string[]) => list.some((c) => codes.has(c));

  if (has(ADMIN_ENTRY_CODES)) return '/admin';
  if (has(INSTRUCTOR_ENTRY_CODES)) return '/instructor';
  if (has(ACCOUNTANT_ENTRY_CODES)) return '/accountant/dashboard';
  return '/dashboard';
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  /**
   * The legacy single "portal" role. It drives WHICH DASHBOARD the user lands on
   * after login. It grants no permissions — that is `permissions`.
   */
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
  registration_number?: string;
  /** Ids of the roles assigned by an administrator via /admin/roles. */
  roles?: string[];
  /**
   * Canonical `"module.action"` codes, resolved server-side and therefore
   * authoritative. `["*"]` is the deliberate super-admin wildcard grant.
   */
  permissions?: string[];
}

export interface LoginResult {
  success: boolean;
  message: string;
  requiresTwoFactor?: boolean;
  userRole?: string;
  /**
   * Where to send the user on success, computed from the profile that was just
   * fetched. Callers must prefer this over re-deriving the destination from
   * context state, which is still the pre-login render.
   */
  redirectTo?: string;
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
  /**
   * True until the server has told us who the user is. Every protected route
   * must render a loading state while this is true — it must never assume the
   * user is anonymous, and it must never trust a cached value.
   */
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<LoginResult>;
  signup: (data: SignupData) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  /**
   * Re-fetch `/auth/profile` and replace the local user + permission set.
   * Call this after anything that can change the current user's access, and
   * note that the window-focus listener calls it automatically.
   */
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  confirmResetPassword: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  verifyEmail: (code: string) => Promise<{ success: boolean; message: string }>;
  resendVerification: () => Promise<{ success: boolean; message: string }>;
  updateProfile: (data: Partial<AuthUser>) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  deleteAccount: (password: string) => Promise<{ success: boolean; message: string }>;
  verifyTwoFactor: (code: string) => Promise<LoginResult>;
  enableTwoFactor: () => Promise<{ success: boolean; secret?: string; qrCode?: string }>;
  disableTwoFactor: (code: string) => Promise<{ success: boolean; message: string }>;
  // ---------------------------------------------------------------------
  // Authorization. Exactly one model: role -> permissions -> can().
  // There is deliberately NO `role === 'admin'` shortcut and no separate
  // `canAccessAdminPanel` backend flag. Both were sources of the bug where a
  // permission was granted in the matrix but had no effect.
  // ---------------------------------------------------------------------
  /** True when the user's permission set contains the wildcard `"*"`. */
  isSuperAdmin: () => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isStudent: () => boolean;
  isInstructor: () => boolean;
  isAdmin: () => boolean;
  isAccountant: () => boolean;
  /** Derived from permissions, never from a separate backend flag. */
  canAccessAdminPanel: () => boolean;
  canAccessStudentRoutes: () => boolean;
  canAccessInstructorRoutes: () => boolean;
  canAccessAccountantRoutes: () => boolean;
  /** True when the user holds at least one code in `codes`. */
  canAnyOf: (codes: string[]) => boolean;
  /** `can(module, action)` -> `permissions.includes("module.action")`. */
  can: (module: string, action: string) => boolean;
  /** True when the user holds at least one `module.action` in `actions`. */
  canAny: (module: string, actions: string[]) => boolean;
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

const AUTH_STORAGE_KEY = 'lms-auth';

/** Stable empty array so `can` callbacks do not re-create on every render. */
const EMPTY_PERMISSIONS: string[] = [];

function readToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

function writeSessionCache(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  // Non-authoritative cache used only to avoid a flash of empty chrome while
  // /auth/profile is in flight. Authorization NEVER reads this.
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user }));
}

function readSessionCache(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw)?.user ?? null;
  } catch {
    return null;
  }
}

function clearSessionStorage(): void {
  if (typeof window === 'undefined') return;
  ['auth_token', AUTH_STORAGE_KEY, 'lms-users'].forEach((key) => localStorage.removeItem(key));
  sessionStorage.removeItem('auth_token');
}

/** Map a `/auth/profile` payload onto the client user shape. */
function userFromProfile(payload: any, fallback?: AuthUser | null): AuthUser | null {
  const backendUser = payload?.user;
  if (!backendUser) return fallback ?? null;

  const roleIds = Array.isArray(payload.roles)
    ? payload.roles
        .map((r: any) => (typeof r === 'string' ? r : r?.role_id ?? r?.id))
        .filter(Boolean)
        .map(String)
    : fallback?.roles ?? [];

  return {
    ...(fallback ?? ({} as AuthUser)),
    id: String(backendUser.id),
    name: backendUser.name ?? `${backendUser.first_name ?? ''} ${backendUser.last_name ?? ''}`.trim(),
    email: backendUser.email ?? fallback?.email ?? '',
    // `role` only selects the landing dashboard. It grants nothing.
    role: (backendUser.role ?? fallback?.role ?? 'student') as UserRole,
    avatar:
      backendUser.avatar ??
      (backendUser.first_name
        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${backendUser.first_name}`
        : fallback?.avatar),
    createdAt: new Date(backendUser.created_at ?? fallback?.createdAt ?? Date.now()),
    isVerified: true,
    loginAttempts: 0,
    isLocked: false,
    twoFactorEnabled: fallback?.twoFactorEnabled ?? false,
    preferences: fallback?.preferences ?? defaultPreferences,
    registration_number: backendUser.registration_number ?? fallback?.registration_number,
    roles: roleIds,
    // Server-authoritative. Legacy codes are mapped to canonical ones here so
    // the rest of the app only ever deals with canonical strings.
    permissions: normalizePermissionCodes(payload.permissions),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<AuthUser[]>(DEMO_USERS);
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });
  const [pendingTwoFactorUser, setPendingTwoFactorUser] = useState<AuthUser | null>(null);

  // Guards against setState after unmount and against overlapping profile fetches.
  const mountedRef = useRef(true);
  const refreshInFlight = useRef<Promise<void> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Bootstrap sequence (fixes the previous race):
   *   token -> /auth/profile -> user + permissions -> isLoading = false -> render
   *
   * `isLoading` deliberately stays true until the server has answered. Route
   * guards must therefore wait instead of redirecting on a stale cached user.
   */
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const cached = readSessionCache();
      const savedUsers = localStorage.getItem('lms-users');
      if (savedUsers) {
        try {
          setUsers(JSON.parse(savedUsers));
        } catch {
          /* corrupt cache is not fatal */
        }
      }

      if (!readToken()) {
        if (!cancelled) {
          setState({ user: null, isAuthenticated: false, isLoading: false, error: null });
        }
        return;
      }

      // Show the cached identity while the authoritative request is in flight.
      // `isLoading` stays true, so no protected route renders yet.
      if (cached) {
        setState({ user: cached, isAuthenticated: false, isLoading: true, error: null });
      }

      const res = await authApi.me();

      if (cancelled || !mountedRef.current) return;

      if (res.error) {
        // 401/403 both mean the token cannot authorize us. Do not retry.
        if (res.code === API_ERROR.UNAUTHENTICATED || res.code === API_ERROR.NETWORK) {
          clearSessionStorage();
          setState({ user: null, isAuthenticated: false, isLoading: false, error: null });
        } else {
          clearSessionStorage();
          setState({ user: null, isAuthenticated: false, isLoading: false, error: res.error ?? null });
        }
        return;
      }

      const user = userFromProfile(res.data, cached);
      if (!user) {
        clearSessionStorage();
        setState({ user: null, isAuthenticated: false, isLoading: false, error: null });
        return;
      }

      writeSessionCache(user);
      setState({ user, isAuthenticated: true, isLoading: false, error: null });
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Keep the session honest: if an administrator changes this user's roles
   * while their tab is open, the new permissions arrive as soon as they come
   * back to the window. No websockets required.
   */
  // The API layer dispatches this when any request comes back 401.
  useEffect(() => {
    const onExpired = () => {
      clearSessionStorage();
      setState({ user: null, isAuthenticated: false, isLoading: false, error: null });
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  // Save users to localStorage
  useEffect(() => {
    localStorage.setItem('lms-users', JSON.stringify(users));
  }, [users]);

  /**
   * Re-read the authoritative profile. De-duplicated so a burst of focus and
   * visibility events only issues one request.
   */
  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!readToken()) return;
    if (refreshInFlight.current) return refreshInFlight.current;

    const run = async () => {
      const res = await authApi.me();
      if (!mountedRef.current) return;

      if (res.error) {
        if (res.code === API_ERROR.UNAUTHENTICATED) {
          clearSessionStorage();
          setState({ user: null, isAuthenticated: false, isLoading: false, error: null });
        }
        return;
      }

      setState((prev) => {
        const next = userFromProfile(res.data, prev.user);
        if (!next) return prev;
        writeSessionCache(next);
        return { ...prev, user: next, isAuthenticated: true, isLoading: false };
      });
    };

    refreshInFlight.current = run().finally(() => {
      refreshInFlight.current = null;
    });

    return refreshInFlight.current;
  }, []);

  /**
   * Permission changes made by another administrator take effect on the next
   * page load, but a tab left open would keep rendering the old grants
   * indefinitely. Re-reading the profile whenever the user comes back to the
   * window closes that gap. No websockets required.
   *
   * Declared after `refreshProfile` so the reference is not in the TDZ while
   * the hook is being called.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const revalidate = () => {
      if (state.isAuthenticated) void refreshProfile();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') revalidate();
    };

    window.addEventListener('focus', revalidate);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', revalidate);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [state.isAuthenticated, refreshProfile]);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await authApi.login(email, password);

      if (response.error) {
        const message = response.error || 'Login failed';
        setState(prev => ({ ...prev, isLoading: false, error: message }));
        return { success: false, message };
      }

      if (response.data) {
        const { token, user: backendUser } = response.data as any;

        if (!token) {
          setState(prev => ({ ...prev, isLoading: false, error: 'Invalid response from server' }));
          return { success: false, message: 'Invalid response from server' };
        }

        localStorage.setItem('auth_token', token);

        // The login response is the first authoritative source of permissions.
        // Building the user from the same helper the profile call uses keeps
        // the two paths from drifting apart.
        const authUser = userFromProfile(response.data, null);

        if (!authUser) {
          setState(prev => ({ ...prev, isLoading: false, error: 'Invalid response from server' }));
          return { success: false, message: 'Invalid response from server' };
        }

        // Converge on the canonical profile so `role` is never stale.
        const profile = await authApi.me();
        const resolved = profile.error ? authUser : userFromProfile(profile.data, authUser) ?? authUser;

        writeSessionCache(resolved);
        setState({
          user: resolved,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        return { success: true, message: 'Login successful', userRole: resolved.role, redirectTo: landingPathFor(resolved) };
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
        setState(prev => ({ ...prev, isLoading: false, error: response.error || null }));
        return { success: false, message: response.error };
      }

      // Do NOT log the user in automatically. Clear any tokens just in case
      localStorage.removeItem('auth_token');
      localStorage.removeItem(AUTH_STORAGE_KEY);

      setState(prev => ({ ...prev, isLoading: false }));
      return { success: true, message: 'Account created successfully! Please log in.' };
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return { success: false, message: errorMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearSessionStorage();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      setPendingTwoFactorUser(null);
      // Hard navigation guarantees no provider state survives the sign-out.
      window.location.href = '/login';
    }
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

  /** Fields a user is allowed to change on their own profile. */
  const SELF_EDITABLE_FIELDS = [
    'name',
    'email',
    'avatar',
    'registration_number',
  ] as const;

  const updateProfile = useCallback((data: Partial<AuthUser>) => {
    if (!state.user) return;

    // Never let a client-side profile edit touch authorization fields. Only
    // the backend may change `role`, `roles` or `permissions`.
    const safe: Partial<AuthUser> = {};
    for (const field of SELF_EDITABLE_FIELDS) {
      if (data[field] !== undefined) {
        (safe as Record<string, unknown>)[field] = data[field];
      }
    }

    const updatedUser = { ...state.user, ...safe };

    setUsers(prev => prev.map(u => u.id === state.user?.id ? updatedUser : u));
    setState(prev => ({ ...prev, user: updatedUser }));
    writeSessionCache(updatedUser);
  }, [state.user]);

  const updatePreferences = useCallback((prefs: Partial<UserPreferences>) => {
    if (!state.user) return;

    const updatedUser = { 
      ...state.user, 
      preferences: { ...state.user.preferences, ...prefs } 
    };
    
    setUsers(prev => prev.map(u => u.id === state.user?.id ? updatedUser : u));
    setState(prev => ({ ...prev, user: updatedUser }));
    writeSessionCache(updatedUser);
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

  const verifyTwoFactor = useCallback(async (code: string): Promise<LoginResult> => {
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

      writeSessionCache(updatedUser);
      setPendingTwoFactorUser(null);

      return {
        success: true,
        message: 'Two-factor authentication successful',
        userRole: updatedUser.role,
        redirectTo: landingPathFor(updatedUser),
      };
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
    writeSessionCache(updatedUser);

    return { success: true, message: 'Two-factor authentication disabled' };
  }, [state.user]);

  // -----------------------------------------------------------------------
  // Authorization: one model, one direction.
  //
  //   user -> roles -> permissions -> can()
  //
  // There is intentionally NO `if (role === 'admin') return true`. A
  // super-admin is represented the same way as everyone else: by holding the
  // wildcard code `"*"`. That keeps "deny a permission" meaningful for every
  // account, including administrators, which is what the roles matrix promises.
  // -----------------------------------------------------------------------
  const permissions = state.user?.permissions ?? EMPTY_PERMISSIONS;

  const isSuperAdmin = useCallback((): boolean => {
    return permissions.includes(SUPER_ADMIN_CODE);
  }, [permissions]);

  const canAnyOf = useCallback(
    (codes: string[]): boolean => {
      if (!state.user) return false;
      if (permissions.includes(SUPER_ADMIN_CODE)) return true;
      return codes.some((code) => permissions.includes(code));
    },
    [permissions, state.user]
  );

  const can = useCallback(
    (module: string, action: string): boolean => {
      if (!state.user) return false;
      if (permissions.includes(SUPER_ADMIN_CODE)) return true;
      return permissions.includes(`${module}.${action}`);
    },
    [permissions, state.user]
  );

  const canAny = useCallback(
    (module: string, actions: string[]): boolean => {
      return actions.some((action) => can(module, action));
    },
    [can]
  );

  /**
   * Entry into /admin. Derived purely from the permission set using the same
   * codes the admin navigation uses, so there is no second flag to keep in sync.
   */
  const canAccessAdminPanel = useCallback((): boolean => {
    return canAnyOf(ADMIN_ENTRY_CODES);
  }, [canAnyOf]);

  const canAccessInstructorRoutes = useCallback((): boolean => {
    return canAnyOf(INSTRUCTOR_ENTRY_CODES);
  }, [canAnyOf]);

  const canAccessAccountantRoutes = useCallback((): boolean => {
    return canAnyOf(ACCOUNTANT_ENTRY_CODES);
  }, [canAnyOf]);

  const hasRole = useCallback(
    (role: UserRole): boolean => state.user?.role === role,
    [state.user]
  );

  const hasAnyRole = useCallback(
    (roles: UserRole[]): boolean => (state.user?.role ? roles.includes(state.user.role) : false),
    [state.user]
  );

  const isStudent = useCallback((): boolean => state.user?.role === 'student', [state.user]);
  const isInstructor = useCallback((): boolean => state.user?.role === 'instructor', [state.user]);
  const isAdmin = useCallback((): boolean => state.user?.role === 'admin', [state.user]);
  const isAccountant = useCallback((): boolean => state.user?.role === 'accountant', [state.user]);
  const canAccessStudentRoutes = useCallback(
    (): boolean => state.user?.role === 'student' || state.user?.role === 'instructor',
    [state.user]
  );

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        signup,
        logout,
        refreshProfile,
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
        isSuperAdmin,
        hasRole,
        hasAnyRole,
        isStudent,
        isInstructor,
        isAdmin,
        isAccountant,
        canAccessAdminPanel,
        canAccessStudentRoutes,
        canAccessInstructorRoutes,
        canAccessAccountantRoutes,
        canAnyOf,
        can,
        canAny,
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
