'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Search, Filter, MoreVertical, Edit, Trash2, UserPlus, Shield, Mail, Check, X } from 'lucide-react';
import { staffApi } from '@/lib/api';

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  phone: string;
  created_at: string;
}

const PASSWORD_RULES = {
  minLength: (p: string) => p.length >= 8,
  hasUpper: (p: string) => /[A-Z]/.test(p),
  hasLower: (p: string) => /[a-z]/.test(p),
  hasNumber: (p: string) => /[0-9]/.test(p),
  hasSymbol: (p: string) => /[^A-Za-z0-9]/.test(p),
};

export default function AdminStaffPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  // Form states
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'instructor',
    password: '',
    password_confirmation: '',
    use_default_password: true,
  });

  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await staffApi.getAll();
      if (res.data) {
        setStaffList(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: 'instructor',
      password: '',
      password_confirmation: '',
      use_default_password: true,
    });
    setFormError(null);
  };

  const openCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEdit = (staff: Staff) => {
    resetForm();
    setForm(prev => ({
      ...prev,
      first_name: staff.first_name,
      last_name: staff.last_name,
      email: staff.email,
      phone: staff.phone || '',
      role: staff.role,
      use_default_password: true, // For edit, we don't change password by default
    }));
    setSelectedStaff(staff);
    setIsEditOpen(true);
  };

  const handleCreateSubmit = async () => {
    setFormError(null);
    if (!form.use_default_password) {
      if (form.password !== form.password_confirmation) {
        setFormError('Passwords do not match');
        return;
      }
      const isValid = Object.values(PASSWORD_RULES).every(rule => rule(form.password));
      if (!isValid) {
        setFormError('Password does not meet all policy requirements');
        return;
      }
    }

    try {
      const res = await staffApi.create(form);
      if (res.error) {
        setFormError(res.error);
        return;
      }
      await fetchStaff();
      setIsCreateOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred');
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedStaff) return;
    setFormError(null);
    
    const payload: any = {
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      phone: form.phone,
      role: form.role,
    };

    if (!form.use_default_password && form.password) {
      if (form.password !== form.password_confirmation) {
        setFormError('Passwords do not match');
        return;
      }
      const isValid = Object.values(PASSWORD_RULES).every(rule => rule(form.password));
      if (!isValid) {
        setFormError('Password does not meet all policy requirements');
        return;
      }
      payload.password = form.password;
      payload.password_confirmation = form.password_confirmation;
    }

    try {
      const res = await staffApi.update(selectedStaff.id, payload);
      if (res.error) {
        setFormError(res.error);
        return;
      }
      await fetchStaff();
      setIsEditOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this staff member?')) {
      await staffApi.delete(id);
      fetchStaff();
    }
  };

  const filteredStaff = staffList.filter(s => {
    const matchesSearch = `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  if (!mounted) return null;

  const PasswordPolicy = () => (
    <div className="text-[10px] space-y-1 mt-2 p-2 bg-muted/50 rounded-md">
      <p className="font-semibold mb-1">Password Policy:</p>
      <div className="flex gap-4">
        <div>
          <p className="flex items-center gap-1">
            {PASSWORD_RULES.minLength(form.password) ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-red-500" />}
            At least 8 characters
          </p>
          <p className="flex items-center gap-1">
            {PASSWORD_RULES.hasUpper(form.password) ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-red-500" />}
            One uppercase letter
          </p>
          <p className="flex items-center gap-1">
            {PASSWORD_RULES.hasLower(form.password) ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-red-500" />}
            One lowercase letter
          </p>
        </div>
        <div>
          <p className="flex items-center gap-1">
            {PASSWORD_RULES.hasNumber(form.password) ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-red-500" />}
            One number
          </p>
          <p className="flex items-center gap-1">
            {PASSWORD_RULES.hasSymbol(form.password) ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-red-500" />}
            One special character
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Staff Management</h1>
          <p className="text-muted-foreground">Manage instructors, administrators, and accountants</p>
        </div>
        <Button onClick={openCreate}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search staff by name, email or role..."
                value={searchTerm || ''}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
            <div className="w-[180px]">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-9">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <SelectValue placeholder="Filter by Role" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="accountant">Accountant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
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
              ) : paginatedStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No staff found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedStaff.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">{staff.first_name} {staff.last_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-sm capitalize">{staff.role}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="text-sm">{staff.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {staff.phone || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openEdit(staff)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Staff
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(staff.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
            <div className="py-4 border-t flex items-center justify-between px-4">
              <div className="text-sm text-muted-foreground">
                Showing {paginatedStaff.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredStaff.length)} of {filteredStaff.length} entries
              </div>
              <Pagination className="justify-end mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.max(1, totalPages) }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink 
                        onClick={() => setCurrentPage(i + 1)}
                        isActive={currentPage === i + 1}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(Math.max(1, totalPages), p + 1))}
                      className={currentPage >= Math.max(1, totalPages) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create Staff Member</DialogTitle>
            <DialogDescription>Add a new instructor, admin, or accountant to the system.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {formError && <div className="text-red-500 text-sm p-2 bg-red-50 rounded-md">{formError}</div>}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Phone (Optional)</Label>
                <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({...form, role: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="accountant">Accountant</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 pt-2 border-t mt-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="default-pass" 
                  checked={form.use_default_password}
                  onCheckedChange={(checked) => setForm({...form, use_default_password: checked as boolean})}
                />
                <label htmlFor="default-pass" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Assign default password (P@ssw0rd2026!)
                </label>
              </div>

              {!form.use_default_password && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Custom Password</Label>
                      <Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm Password</Label>
                      <Input type="password" value={form.password_confirmation} onChange={e => setForm({...form, password_confirmation: e.target.value})} />
                    </div>
                  </div>
                  <PasswordPolicy />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateSubmit}>Create Staff</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>Update staff details. Leave password unchecked to keep current.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {formError && <div className="text-red-500 text-sm p-2 bg-red-50 rounded-md">{formError}</div>}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Phone (Optional)</Label>
                <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({...form, role: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="accountant">Accountant</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 pt-2 border-t mt-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="edit-pass" 
                  checked={!form.use_default_password}
                  onCheckedChange={(checked) => setForm({...form, use_default_password: !checked, password: '', password_confirmation: ''})}
                />
                <label htmlFor="edit-pass" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Update Password
                </label>
              </div>

              {!form.use_default_password && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm Password</Label>
                      <Input type="password" value={form.password_confirmation} onChange={e => setForm({...form, password_confirmation: e.target.value})} />
                    </div>
                  </div>
                  <PasswordPolicy />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
