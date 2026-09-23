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
import { rolesApi, RoleRecord, PermissionRecord } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ShieldCheck, Lock, Plus, Save, Trash2, UserCog, Users } from 'lucide-react';

interface RoleUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  roles?: { id: string; name: string }[];
}

export default function AdminRolesPage() {
  const { can } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      if (rolesRes.error) throw new Error(rolesRes.error);
      if (permsRes.error) throw new Error(permsRes.error);
      if (usersRes.error) throw new Error(usersRes.error);

      const rolesData = rolesRes.data as unknown as RoleRecord[];
      setRoles(rolesData);
      setPermissions(permsRes.data as unknown as PermissionRecord[]);
      setUsers(usersRes.data as unknown as RoleUser[]);

      if (rolesData.length > 0) {
        const current =
          rolesData.find((r) => r.id === matrixRoleId) || rolesData[0];
        setMatrixRoleId(current.id);
        setMatrixCodes((current.permissions || []).map((p) => p.code));
        setMatrixDirty(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load roles');
    } finally {
      setIsLoading(false);
    }
  };

  const permissionGroups = useMemo(() => {
    const groups = new Map<string, { action: string; label: string; hint?: string }[]>();
    permissions.forEach((p) => {
      const existing = groups.get(p.module) || [];
      existing.push({ action: p.action, label: p.label, hint: p.hint });
      groups.set(p.module, existing);
    });
    return Array.from(groups.entries());
  }, [permissions]);

  const selectedMatrixRole = useMemo(
    () => roles.find((r) => r.id === matrixRoleId) || null,
    [roles, matrixRoleId]
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
    setMatrixCodes((role?.permissions || []).map((p) => p.code));
    setMatrixDirty(false);
  };

  const saveMatrix = async () => {
    if (!selectedMatrixRole) return;
    setMatrixSaving(true);
    setError(null);
    try {
      const res = await rolesApi.update(selectedMatrixRole.id, {
        name: selectedMatrixRole.name,
        description: selectedMatrixRole.description || '',
        permissions: matrixCodes,
      });
      if (res.error) throw new Error(res.error);
      setMatrixDirty(false);
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Failed to save permissions');
    } finally {
      setMatrixSaving(false);
    }
  };

  const openCreateRole = () => {
    setEditingRole(null);
    setRoleForm({ name: '', description: '' });
    setRoleFormError(null);
    setRoleDialogOpen(true);
  };

  const openEditRole = (role: RoleRecord) => {
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
      if (res.error) throw new Error(res.error);
      setRoleDialogOpen(false);
      await loadAll();
    } catch (err: any) {
      setRoleFormError(err.message || 'Failed to save role');
    }
  };

  const deleteRole = async (role: RoleRecord) => {
    if (!confirm(`Delete role "${role.name}"? Users assigned it will lose its permissions.`)) return;
    try {
      const res = await rolesApi.delete(role.id);
      if (res.error) throw new Error(res.error);
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Failed to delete role');
    }
  };

  const openAssign = (user: RoleUser) => {
    setAssignUser(user);
    setAssignRoleIds((user.roles || []).map((r) => r.id));
    setRoleFormError(null);
  };

  const saveAssign = async () => {
    if (!assignUser) return;
    try {
      const res = await rolesApi.assignRoles(assignUser.id, assignRoleIds);
      if (res.error) throw new Error(res.error);
      setAssignUser(null);
      await loadAll();
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
                <div className="space-y-8">
                  {permissionGroups.map(([module, actions]) => (
                    <div key={module}>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                        {module}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {actions.map((permission) => {
                          const code = `${module}.${permission.action}`;
                          const checked = matrixCodes.includes(code);
                          const canToggle = !selectedMatrixRole.is_system || can('roles', 'update');
                          return (
                            <div
                              key={code}
                              className={`flex items-start gap-3 border rounded-lg p-3 transition-colors ${
                                checked ? 'border-primary/40 bg-primary/5' : 'border-border'
                              }`}
                            >
                              <Checkbox
                                id={code}
                                checked={checked}
                                onCheckedChange={() => toggleMatrixCode(code)}
                                disabled={!canToggle}
                              />
                              <div>
                                <Label
                                  htmlFor={code}
                                  className="text-sm font-medium leading-tight block"
                                >
                                  {permission.label}
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1">{code}</p>
                                {permission.hint && (
                                  <p className="text-[11px] text-muted-foreground/70 mt-0.5">{permission.hint}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
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