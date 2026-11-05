'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, Search, ShieldCheck, UserCog, Users } from 'lucide-react';

import { rolesApi, describeApiError, isPermissionDenied, type RoleUser } from '@/lib/api';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { useAuth } from '@/lib/auth-context';
import { usePermissionGuard } from '@/lib/use-permission';

const PORTAL_LABELS: Record<string, string> = {
  admin: 'Admin',
  instructor: 'Instructor',
  accountant: 'Accountant',
  student: 'Student',
};

const PORTAL_BADGE: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  instructor: 'bg-blue-100 text-blue-800',
  accountant: 'bg-emerald-100 text-emerald-800',
  student: 'bg-slate-100 text-slate-800',
};

/**
 * User directory.
 *
 * This page used to be a self-contained mock: a hard-coded `initialUsers`
 * array, `useState` CRUD that never touched the API, and a `super_admin` role
 * that exists nowhere in the real auth system. Any permission change made here
 * was silently discarded, which made it look as though the roles matrix was
 * broken.
 *
 * It is now backed by the same endpoints as the rest of the admin panel and
 * uses the same canonical permission codes. Creating and editing staff and
 * students is delegated to the dedicated pages, which have their own forms and
 * API contracts.
 */
export default function AdminUsersPage() {
  return (
    <PermissionGuard module="students" action="view" backHref="/admin">
      <AdminUsersContent />
    </PermissionGuard>
  );
}

function AdminUsersContent() {
  const { user: currentUser, refreshProfile } = useAuth();
  const guardAssign = usePermissionGuard('roles', 'assign');

  const [users, setUsers] = useState<RoleUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  const [search, setSearch] = useState('');
  const [portalFilter, setPortalFilter] = useState('all');

  const [assignTarget, setAssignTarget] = useState<RoleUser | null>(null);
  const [assignRoleIds, setAssignRoleIds] = useState<string[]>([]);
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const [roles, setRoles] = useState<{ id: string; name: string; is_system?: boolean }[]>([]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await rolesApi.getUsers();
      if (isPermissionDenied(res)) {
        setDenied(true);
        setUsers([]);
        return;
      }
      if (res.error) throw new Error(describeApiError(res));
      setDenied(false);
      setUsers((res.data as unknown as RoleUser[]) ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Roles are only needed for the assignment dialog.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await rolesApi.getAll();
      if (cancelled || !res.data) return;
      setRoles(res.data as { id: string; name: string; is_system?: boolean }[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const portals = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => u.role && set.add(u.role));
    return Array.from(set).sort();
  }, [users]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      const haystack = `${u.first_name ?? ''} ${u.last_name ?? ''} ${u.email ?? ''}`.toLowerCase();
      const matchesSearch = !term || haystack.includes(term);
      const matchesPortal = portalFilter === 'all' || u.role === portalFilter;
      return matchesSearch && matchesPortal;
    });
  }, [users, search, portalFilter]);

  const openAssign = (user: RoleUser) => {
    if (!guardAssign()) return;
    setAssignTarget(user);
    setAssignRoleIds((user.roles ?? []).map((r: any) => r.id));
    setAssignError(null);
  };

  const saveAssign = async () => {
    if (!assignTarget) return;
    if (!guardAssign()) return;

    setAssignSaving(true);
    setAssignError(null);
    try {
      const res = await rolesApi.assignRoles(assignTarget.id, assignRoleIds);
      if (res.error) throw new Error(describeApiError(res));

      const name = `${assignTarget.first_name ?? ''} ${assignTarget.last_name ?? ''}`.trim();
      setAssignTarget(null);
      await load();

      // If the admin changed their own roles, refresh immediately instead of
      // waiting for the next window focus.
      if (currentUser && String(assignTarget.id) === String(currentUser.id)) {
        await refreshProfile();
        toast.success('Your roles were updated', { description: 'Your permissions have been reloaded.' });
      } else {
        toast.success(`Roles updated for ${name}`, {
          description:
            'The new permissions apply the next time that user loads the app or returns to their tab.',
        });
      }
    } catch (err: any) {
      setAssignError(err.message || 'Failed to update roles');
    } finally {
      setAssignSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Users</h1>
          <p className="text-muted-foreground">
            Every account in the system, with the roles that determine what each one can do.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {denied ? (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="pt-6 text-sm text-amber-900">
            You don&apos;t have permission to list users. This is enforced by the server, not just hidden in the interface.
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6 text-sm text-red-800">{error}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Directory</CardTitle>
          <CardDescription>
            Staff and student records are managed on their own pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="pl-9"
              />
            </div>
            <Select value={portalFilter} onValueChange={setPortalFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All portals" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All portals</SelectItem>
                {portals.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PORTAL_LABELS[p] ?? p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Portal</TableHead>
                  <TableHead>Roles (determine permissions)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Loading users…
                    </TableCell>
                  </TableRow>
                ) : denied ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Not permitted to list users.
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {users.length === 0 ? 'No users found.' : 'No users match your search.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="font-medium">
                          {`${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || '—'}
                        </div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={PORTAL_BADGE[u.role] ?? 'bg-slate-100 text-slate-800'}
                        >
                          {PORTAL_LABELS[u.role] ?? u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(u.roles ?? []).length === 0 ? (
                          <span className="text-sm text-muted-foreground">No roles assigned</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {(u.roles ?? []).map((r: any) => (
                              <Badge key={r.id} variant="outline">
                                {r.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href="/admin/users/staff">
                              <UserCog className="mr-2 h-4 w-4" /> Staff
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href="/admin/users/students">
                              <Users className="mr-2 h-4 w-4" /> Students
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openAssign(u)}>
                            <ShieldCheck className="mr-2 h-4 w-4" /> Roles
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!assignTarget} onOpenChange={(open) => !open && setAssignTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign roles</DialogTitle>
            <DialogDescription>
              {assignTarget
                ? `Choose which roles apply to ${`${assignTarget.first_name ?? ''} ${assignTarget.last_name ?? ''}`.trim()}. Permissions are the union of every selected role.`
                : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {roles.length === 0 ? (
              <p className="text-sm text-muted-foreground">Loading roles…</p>
            ) : (
              roles.map((role) => (
                <label
                  key={role.id}
                  className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/40"
                >
                  <Checkbox
                    checked={assignRoleIds.includes(role.id)}
                    onCheckedChange={(on) =>
                      setAssignRoleIds((prev) =>
                        on ? [...prev, role.id] : prev.filter((id) => id !== role.id)
                      )
                    }
                  />
                  <div>
                    <div className="text-sm font-medium">
                      {role.name}
                      {role.is_system && (
                        <Badge variant="outline" className="ml-2">
                          system
                        </Badge>
                      )}
                    </div>
                  </div>
                </label>
              ))
            )}
            {assignError && <p className="text-sm text-red-600">{assignError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignTarget(null)}>
              Cancel
            </Button>
            <Button onClick={saveAssign} disabled={assignSaving}>
              {assignSaving ? 'Saving…' : 'Save roles'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
