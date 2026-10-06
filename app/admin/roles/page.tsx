'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { rolesApi, RoleRecord, PermissionRecord, RoleUser, describeApiError, isPermissionDenied } from '@/lib/api';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { useAuth } from '@/lib/auth-context';
import { usePermissionGuard } from '@/lib/use-permission';
import {
  ACTION_LABELS,
  ACTION_ORDER,
  CANONICAL_MATRIX,
  LEGACY_CODE_REPLACEMENTS,
  MODULE_LABELS,
  SELF_PROTECT_CODES,
  SUPER_ADMIN_CODE,
  isCanonicalCode,
  normalizePermissionCodes,
  type PermissionAction,
} from '@/lib/permissions';
import { ShieldCheck, Lock, Plus, Save, Trash2, UserCog, Users } from 'lucide-react';

export default function AdminRolesPage() {
  return (
    <PermissionGuard module="roles" action="view" backHref="/admin">
      <AdminRolesContent />
    </PermissionGuard>
  );
}

function AdminRolesContent() {
  const { can, isSuperAdmin, user: currentUser, refreshProfile } = useAuth();
  const guardCreate = usePermissionGuard('roles', 'create');
  const guardUpdate = usePermissionGuard('roles', 'update');
  const guardDelete = usePermissionGuard('roles', 'delete');
  const guardAssign = usePermissionGuard('roles', 'assign');

  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [users, setUsers] = useState<RoleUser[]>([]);

  // Matrix state
  const [matrixRoleId, setMatrixRoleId] = useState<string>('');
  const [matrixCodes, setMatrixCodes] = useState<string[]>([]);
  const [matrixDirty, setMatrixDirty] = useState(false);
  const [matrixSaving, setMatrixSaving] = useState(false);

  // Role create/edit state
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
  const [roleForm, setRoleForm] = useState({ name: '', description: '' });
  const [roleFormError, setRoleFormError] = useState<string | null>(null);

  // Assign state
  const [assignUser, setAssignUser] = useState<RoleUser | null>(null);
  const [assignRoleIds, setAssignRoleIds] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    // The page is already behind <PermissionGuard module="roles" action="view">,
    // so by the time this runs the user is known to hold roles.view.
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [rolesRes, permsRes, usersRes] = await Promise.all([
        rolesApi.getAll(),
        rolesApi.getPermissions(),
        rolesApi.getUsers(),
      ]);

      // Distinguish "denied" from "broken" — these used to collapse into the
      // same "Failed to load roles" message, which is why permission bugs were
      // so hard to diagnose.
      const denied = [rolesRes, permsRes, usersRes].find(isPermissionDenied);
      if (denied) {
        setRoles([]);
        setPermissions([]);
        setUsers([]);
        setError(describeApiError(denied));
        return;
      }

      if (rolesRes.error) throw new Error(describeApiError(rolesRes));
      if (permsRes.error) throw new Error(describeApiError(permsRes));
      if (usersRes.error) throw new Error(describeApiError(usersRes));

      const rolesData = (rolesRes.data as unknown as RoleRecord[]) ?? [];
      setRoles(rolesData);
      setPermissions((permsRes.data as unknown as PermissionRecord[]) ?? []);
      setUsers((usersRes.data as unknown as RoleUser[]) ?? []);

      if (rolesData.length > 0) {
        const current =
          rolesData.find((r) => r.id === matrixRoleId) || rolesData[0];
        setMatrixRoleId(current.id);
        // Normalize: the backend may return codes or full permission records.
        setMatrixCodes(normalizePermissionCodes(current.permissions));
        setMatrixDirty(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load roles');
    } finally {
      setIsLoading(false);
    }
  };

  const moduleLabels = MODULE_LABELS;

  /** Backend permission records, indexed for tooltips only. */
  const permissionByAction = useMemo(() => {
    const map = new Map<string, Map<string, PermissionRecord>>();
    permissions.forEach((p) => {
      if (!p?.module || !p?.action) return;
      if (!map.has(p.module)) map.set(p.module, new Map());
      map.get(p.module)!.set(p.action, p);
    });
    return map;
  }, [permissions]);

  /**
   * The matrix is rendered from CANONICAL_MATRIX, not from whatever the API
   * happens to return. This is the fix for the original bug: the sidebar and
   * the matrix previously derived their own module names, so ticking a box in
   * the matrix could grant a code the app never checked.
   */
  const matrixColumns = useMemo(() => {
    const present = new Set(CANONICAL_MATRIX.flatMap((m) => m.actions));
    return ACTION_ORDER.filter((action) => present.has(action));
  }, []);

  const selectedMatrixRole = useMemo(
    () => roles.find((r) => r.id === matrixRoleId) || null,
    [roles, matrixRoleId]
  );

  /**
   * Codes the backend holds that this application does not know how to check.
   * Surfaced instead of silently dropped, so a typo in a seeded permission
   * becomes visible rather than a mystery denial.
   */
  const unmappedCodes = useMemo(
    () => matrixCodes.filter((c) => !isCanonicalCode(c)),
    [matrixCodes]
  );

  const toggleMatrixCode = (code: string) => {
    setMatrixCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
    setMatrixDirty(true);
  };

  const selectMatrixRole = (roleId: string) => {
    setMatrixRoleId(roleId);
    const role = roles.find((r) => r.id === roleId);
    setMatrixCodes(normalizePermissionCodes(role?.permissions));
    setMatrixDirty(false);
  };

  const saveMatrix = async () => {
    if (!selectedMatrixRole) return;
    // The handler is reachable even though the button is hidden.
    if (!guardUpdate()) return;

    // Refuse to save a matrix that would lock the signed-in user out of
    // managing roles. Without this, removing your own last role silently
    // bricks the admin panel. A super-admin is exempt because they still hold
    // the "*" wildcard afterwards.
    if (editingOwnPermissionSet()) {
      setError(
        'You cannot remove your own Roles & Permissions access. Ask another administrator to make this change.'
      );
      return;
    }

    setMatrixSaving(true);
    setError(null);
    try {
      const res = await rolesApi.update(selectedMatrixRole.id, {
        name: selectedMatrixRole.name,
        description: selectedMatrixRole.description || '',
        permissions: matrixCodes,
      });
      if (res.error) throw new Error(describeApiError(res));
      setMatrixDirty(false);
      setNotice(`Permissions saved for "${selectedMatrixRole.name}".`);
      await loadAll();
      // If this role is the signed-in user's own, converge immediately.
      if (currentUserHasRole(selectedMatrixRole.id)) await refreshProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to save permissions');
    } finally {
      setMatrixSaving(false);
    }
  };

  function currentUserHasRole(roleId: string): boolean {
    return (currentUser?.roles ?? []).includes(roleId);
  }

  /**
   * True when saving `matrixCodes` would strip the permissions this user needs
   * to keep administering roles.
   */
  function editingOwnPermissionSet(): boolean {
    if (!selectedMatrixRole || !currentUser) return false;
    if (!currentUserHasRole(selectedMatrixRole.id)) return false;
    if (currentUser?.permissions?.includes(SUPER_ADMIN_CODE)) return false;

    return SELF_PROTECT_CODES.some((required) => !matrixCodes.includes(required));
  }

  const openCreateRole = () => {
    if (!guardCreate()) return;
    setEditingRole(null);
    setRoleForm({ name: '', description: '' });
    setRoleFormError(null);
    setRoleDialogOpen(true);
  };

  const openEditRole = (role: RoleRecord) => {
    if (!guardUpdate()) return;
    setEditingRole(role);
    setRoleForm({ name: role.name, description: role.description || '' });
    setRoleFormError(null);
    setRoleDialogOpen(true);
  };

  const saveRole = async () => {
    setRoleFormError(null);
    if (!roleForm.name.trim()) {
      setRoleFormError('Role name is required');
      return;
    }
    // Guarded again here: the dialog can be opened by any code path.
    if (editingRole ? !guardUpdate() : !guardCreate()) return;
    try {
      const res = editingRole
        ? await rolesApi.update(editingRole.id, {
            name: roleForm.name.trim(),
            description: roleForm.description || '',
          })
        : await rolesApi.create({
            name: roleForm.name.trim(),
            description: roleForm.description || '',
          });
      if (res.error) throw new Error(describeApiError(res));
      setRoleDialogOpen(false);
      await loadAll();
    } catch (err: any) {
      setRoleFormError(err.message || 'Failed to save role');
    }
  };

  const deleteRole = async (role: RoleRecord) => {
    if (!guardDelete()) return;
    if (role.is_system) {
      setError(`"${role.name}" is a system role and cannot be deleted.`);
      return;
    }
    if (!confirm(`Delete role "${role.name}"? Users assigned it will lose its permissions.`)) return;
    try {
      const res = await rolesApi.delete(role.id);
      if (res.error) throw new Error(describeApiError(res));
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Failed to delete role');
    }
  };

  const openAssign = (user: RoleUser) => {
    if (!guardAssign()) return;
    setAssignUser(user);
    setAssignRoleIds((user.roles || []).map((r) => r.id));
    setRoleFormError(null);
  };

  const saveAssign = async () => {
    if (!assignUser) return;
    if (!guardAssign()) return;
    try {
      const res = await rolesApi.assignRoles(assignUser.id, assignRoleIds);
      if (res.error) throw new Error(describeApiError(res));
      setAssignUser(null);
      setNotice(
        `Roles updated for ${assignUser.first_name} ${assignUser.last_name}. ` +
          'Their permissions take effect the next time they load the app, or immediately when they return to this tab.'
      );
      await loadAll();

      // If the admin just changed their own roles, converge immediately rather
      // than leaving them with a stale permission set.
      if (currentUser && String(assignUser.id) === String(currentUser.id)) {
        await refreshProfile();
      }
    } catch (err: any) {
      setRoleFormError(err.message || 'Failed to update roles');
    }
  };

  if (!mounted) return null;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Roles & Permissions</h1>
          <p className="text-muted-foreground">
            Define dynamic roles and control what users can access in the admin panel
          </p>
        </div>
        {can('roles', 'create') && (
          <Button onClick={openCreateRole}>
            <Plus className="w-4 h-4 mr-2" />
            New Role
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm">
          {error}
          <button className="ml-3 underline" onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {notice && (
        <div className="mb-6 p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm flex items-start gap-2">
          <span className="flex-1">{notice}</span>
          <button className="underline" onClick={() => setNotice(null)}>Dismiss</button>
        </div>
      )}

      {isSuperAdmin() && (
        <div className="mb-6 p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-sm">
          Your account holds the <code className="font-semibold">{SUPER_ADMIN_CODE}</code> wildcard, so it
          bypasses every permission check. It is preserved on save and is not shown as a matrix row — to give
          up full access, remove this role from your own account and assign a scoped one instead.
        </div>
      )}

      {unmappedCodes.length > 0 && (
        <div className="mb-6 p-3 bg-orange-50 text-orange-800 border border-orange-200 rounded-lg text-sm">
          <p className="font-medium mb-1">
            {unmappedCodes.length} permission code{unmappedCodes.length > 1 ? 's' : ''} on this role{' '}
            {unmappedCodes.length > 1 ? 'are' : 'is'} not recognised by the application and will have no effect:
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {unmappedCodes.map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5">
                <code className="rounded bg-white px-1.5 py-0.5 text-xs border border-orange-200">{c}</code>
                {LEGACY_CODE_REPLACEMENTS[c] && (
                  <span className="text-xs">
                    &rarr; rename to{' '}
                    <code className="rounded bg-white px-1.5 py-0.5 text-xs border border-orange-200">
                      {LEGACY_CODE_REPLACEMENTS[c]}
                    </code>
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      <Tabs defaultValue="matrix">
        <TabsList className="mb-6">
          <TabsTrigger value="matrix">
            <ShieldCheck className="w-4 h-4 mr-2" />
            Permission Matrix
          </TabsTrigger>
          <TabsTrigger value="roles">
            <UserCog className="w-4 h-4 mr-2" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            User Assignment
          </TabsTrigger>
        </TabsList>

        {/* ---------------- Permission Matrix ---------------- */}
        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Permission Matrix
                    {selectedMatrixRole?.is_system && (
                      <Badge variant="outline" className="gap-1">
                        <Lock className="w-3 h-3" />
                        System
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Toggle the actions each role is allowed to perform. Changes apply immediately after saving.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={matrixRoleId} onValueChange={selectMatrixRole}>
                    <SelectTrigger className="w-[260px]">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name} {role.is_system ? '(system)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {can('roles', 'update') && matrixDirty && (
                    <Button
                      onClick={saveMatrix}
                      disabled={matrixSaving || !selectedMatrixRole}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {matrixSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-12 text-center text-muted-foreground">Loading...</div>
              ) : !selectedMatrixRole ? (
                <div className="py-12 text-center text-muted-foreground">
                  No roles available. Create a role to configure permissions.
                </div>
              ) : (
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="w-56 min-w-[200px] sticky left-0 bg-muted/40 z-10 py-3 whitespace-nowrap">
                          Module
                        </TableHead>
                        {matrixColumns.map((col) => (
                          <TableHead
                            key={col}
                            className="text-center min-w-[120px] bg-muted/40 whitespace-nowrap py-3"
                          >
                            {ACTION_LABELS[col] || col}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {CANONICAL_MATRIX.map(({ module, label, codes }) => (
                        <TableRow key={module}>
                          <TableCell className="font-semibold sticky left-0 bg-background z-10 py-3 whitespace-nowrap">
                            {label || moduleLabels[module] || module}
                          </TableCell>
                          {matrixColumns.map((col) => {
                            const cellCode = `${module}.${col}`;
                            // A cell is only editable if that permission code is
                            // part of this module's canonical action set.
                            if (!codes.includes(cellCode)) {
                              return (
                                <TableCell
                                  key={cellCode}
                                  className="text-center text-muted-foreground/30 py-3"
                                >
                                  <span>—</span>
                                </TableCell>
                              );
                            }
                            const perm = permissionByAction.get(module)?.get(col);
                            const checked = matrixCodes.includes(cellCode);
                            const canToggle =
                              !selectedMatrixRole.is_system || can('roles', 'update');
                            return (
                              <TableCell key={cellCode} className="text-center py-3">
                                <Checkbox
                                  id={cellCode}
                                  checked={checked}
                                  onCheckedChange={() => toggleMatrixCode(cellCode)}
                                  disabled={!canToggle}
                                  title={perm?.hint ? `${ACTION_LABELS[col]} — ${perm.hint}` : cellCode}
                                  aria-label={`${label} ${ACTION_LABELS[col]}`}
                                  className="mx-auto size-5 rounded-full"
                                />
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Roles ---------------- */}
        <TabsContent value="roles">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : roles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No roles defined
                      </TableCell>
                    </TableRow>
                  ) : (
                    roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-blue-500" />
                            <span className="font-medium">{role.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-md">
                          {role.description || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={role.is_system ? 'default' : 'outline'}>
                            {role.is_system ? 'System' : 'Custom'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Users className="w-3.5 h-3.5 text-muted-foreground" />
                            {role.users_count || 0}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {can('roles', 'update') && (
                              <Button variant="ghost" size="sm" onClick={() => openEditRole(role)}>
                                Edit
                              </Button>
                            )}
                            {can('roles', 'delete') && !role.is_system && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600"
                                onClick={() => deleteRole(role)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- User Assignment ---------------- */}
        <TabsContent value="users">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Portal</TableHead>
                    <TableHead>Dynamic Roles</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-medium">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {(user.roles || []).length === 0 ? (
                              <span className="text-sm text-muted-foreground">—</span>
                            ) : (
                              user.roles!.map((role) => (
                                <Badge key={role.id} variant="outline">
                                  {role.name}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {can('roles', 'assign') && (
                            <Button variant="outline" size="sm" onClick={() => openAssign(user)}>
                              <UserCog className="w-3.5 h-3.5 mr-2" />
                              Manage Roles
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create / Edit Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
            <DialogDescription>
              {editingRole
                ? 'Update the role name and description. Permissions are configured in the matrix.'
                : 'Create a new role, then configure its permissions in the matrix.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {roleFormError && (
              <div className="text-red-500 text-sm p-2 bg-red-50 rounded-md">{roleFormError}</div>
            )}
            <div className="space-y-2">
              <Label>Role Name</Label>
              <Input
                placeholder="e.g. Registrar"
                value={roleForm.name}
                disabled={editingRole?.is_system}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              />
              {editingRole?.is_system && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lock className="w-3 h-3" /> System roles cannot be renamed.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="What does this role do?"
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveRole}>{editingRole ? 'Save Changes' : 'Create Role'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Roles Dialog */}
      <Dialog open={!!assignUser} onOpenChange={(open) => !open && setAssignUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Roles — {assignUser ? `${assignUser.first_name} ${assignUser.last_name}` : ''}</DialogTitle>
            <DialogDescription>
              Assign one or more dynamic roles to this user. Permissions across all roles are combined.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {roleFormError && (
              <div className="text-red-500 text-sm p-2 bg-red-50 rounded-md">{roleFormError}</div>
            )}
            <div className="grid grid-cols-1 gap-3">
              {roles.map((role) => {
                const checked = assignRoleIds.includes(role.id);
                return (
                  <div
                    key={role.id}
                    className="flex items-center justify-between border rounded-lg p-3"
                  >
                    <div>
                      <div className="text-sm font-medium flex items-center gap-2">
                        {role.name}
                        {role.is_system && (
                          <Badge variant="outline" className="gap-1 text-[10px]">
                            <Lock className="w-2.5 h-2.5" />
                            system
                          </Badge>
                        )}
                      </div>
                      {role.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                      )}
                    </div>
                    <Switch
                      checked={checked}
                      onCheckedChange={(on) =>
                        setAssignRoleIds((prev) =>
                          on ? [...prev, role.id] : prev.filter((id) => id !== role.id)
                        )
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignUser(null)}>Cancel</Button>
            <Button onClick={saveAssign}>Save Roles</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}