'use client';

import Link from 'next/link';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import type { PermissionAction, PermissionModule } from '@/lib/permissions';

/** Full-page spinner shown while `/auth/profile` is in flight. */
export function AuthLoadingScreen({ label = 'Loading your workspace…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
      <Loader2 className="h-8 w-8 animate-spin text-[#0D7377]" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * 403 page. Rendered instead of the protected content when the signed-in user
 * does not hold the permission a page requires.
 */
export function Forbidden({
  module,
  action,
  backHref = '/',
  backLabel = 'Go back',
}: {
  module?: string;
  action?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="rounded-full bg-amber-100 p-4">
        <ShieldAlert className="h-8 w-8 text-amber-700" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900">You don&apos;t have access to this page</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Your account is signed in, but it is missing the{' '}
        {module && action ? (
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-700">
            {module}.{action}
          </code>
        ) : (
          'required'
        )}{' '}
        permission. Ask an administrator to grant it from Roles &amp; Permissions.
      </p>
      <Button asChild variant="outline">
        <Link href={backHref}>{backLabel}</Link>
      </Button>
    </div>
  );
}

/**
 * Page-level permission guard.
 *
 * Renders nothing while the session is still being resolved, so a protected
 * page never flashes before the guard has run. Hiding a sidebar link is not
 * access control — this is what makes the URL itself safe to type.
 *
 * The backend must still enforce the same permission. See
 * docs/BACKEND-RBAC-CONTRACT.md.
 */
export function PermissionGuard({
  module,
  action,
  children,
  backHref,
}: {
  module: PermissionModule;
  action: PermissionAction;
  children: React.ReactNode;
  backHref?: string;
}) {
  const { can, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <AuthLoadingScreen />;
  if (!isAuthenticated) return null;
  if (!can(module, action)) return <Forbidden module={module} action={action} backHref={backHref} />;

  return <>{children}</>;
}

/**
 * Convenience wrapper for guarding a whole portal section.
 * `admin.access` is the dedicated entry code; the navigation-derived
 * alternatives are applied inside `canAccessAdminPanel`.
 */
export function AdminAccessGuard({ children }: { children: React.ReactNode }) {
  const { canAccessAdminPanel, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <AuthLoadingScreen />;
  if (!isAuthenticated) return null;
  if (!canAccessAdminPanel()) return <Forbidden module="admin" action="access" backHref="/dashboard" />;

  return <>{children}</>;
}
