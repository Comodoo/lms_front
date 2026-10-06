'use client';

import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useAuth } from './auth-context';
import type { PermissionAction, PermissionModule } from './permissions';

/**
 * Mutation guard.
 *
 * Buttons are hidden with `can()`, but a hidden button is not a guard: the
 * handler is still reachable from the React tree. Wrap every mutating callback
 * with `guard()` so a click without the permission fails loudly instead of
 * firing a request.
 *
 * The backend must still deny the request. This only removes the accidental
 * case and makes the refusal visible to the person who clicked.
 */
export function usePermissionGuard(module: PermissionModule, action: PermissionAction) {
  const { can } = useAuth();

  return useCallback(() => {
    if (can(module, action)) return true;
    toast.error("You don't have permission to perform this action.", {
      description: `Missing permission: ${module}.${action}`,
    });
    return false;
  }, [can, module, action]);
}

/** Throwing variant, for `async` handlers that should abort. */
export class PermissionError extends Error {
  readonly code = 'INSUFFICIENT_PERMISSION' as const;
  constructor(public readonly permission: string) {
    super(`Missing permission: ${permission}`);
    this.name = 'PermissionError';
  }
}

export function useRequirePermission(module: PermissionModule, action: PermissionAction) {
  const { can } = useAuth();
  const permission = `${module}.${action}`;

  return useCallback(() => {
    if (!can(module, action)) throw new PermissionError(permission);
  }, [can, module, action, permission]);
}

/**
 * Convenience bundle for pages that need many checks:
 *
 *   const p = usePermissions();
 *   if (!p.roles('update')) return;
 */
export function usePermissions() {
  const { can, isSuperAdmin } = useAuth();

  return useMemo(
    () => ({
      can,
      isSuperAdmin: isSuperAdmin(),
      roles: (action: PermissionAction) => can('roles', action),
      students: (action: PermissionAction) => can('students', action),
      staff: (action: PermissionAction) => can('staff', action),
      courses: (action: PermissionAction) => can('courses', action),
      programs: (action: PermissionAction) => can('programs', action),
      registrations: (action: PermissionAction) => can('registrations', action),
      results: (action: PermissionAction) => can('results', action),
      fees: (action: PermissionAction) => can('fees', action),
      reports: (action: PermissionAction) => can('reports', action),
      settings: (action: PermissionAction) => can('settings', action),
      dashboard: (action: PermissionAction) => can('dashboard', action),
    }),
    [can, isSuperAdmin]
  );
}
