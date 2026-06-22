'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users, Search, MoreVertical, Plus, UserCheck, UserX, Eye, Trash2, 
  Mail, Download, Filter, Edit, Ban, Shield, Key, RefreshCw,
  ChevronLeft, ChevronRight, ArrowUpDown, CheckCircle, XCircle
} from 'lucide-react';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin' | 'super_admin';
  country: string;
  phone?: string;
  joinedAt: string;
  lastLogin?: string;
  status: 'active' | 'pending' | 'suspended' | 'banned';
  emailVerified: boolean;
  coursesEnrolled?: number;
  coursesCreated?: number;
  totalSpent?: number;
  totalEarned?: number;
}

// Mock data
const initialUsers: User[] = [
  { id: '1', name: 'John Mwangi', email: 'john@example.com', role: 'student', country: 'Kenya', phone: '+254712345678', joinedAt: '2024-03-15', lastLogin: '2024-03-20', status: 'active', emailVerified: true, coursesEnrolled: 5, totalSpent: 250 },
  { id: '2', name: 'Sarah Ochieng', email: 'sarah@example.com', role: 'instructor', country: 'Kenya', phone: '+254723456789', joinedAt: '2024-03-14', lastLogin: '2024-03-19', status: 'active', emailVerified: true, coursesCreated: 3, totalEarned: 15000 },
  { id: '3', name: 'Michael Adeyemi', email: 'michael@example.com', role: 'student', country: 'Nigeria', joinedAt: '2024-03-14', status: 'pending', emailVerified: false, coursesEnrolled: 0 },
  { id: '4', name: 'Grace Mensah', email: 'grace@example.com', role: 'student', country: 'Ghana', phone: '+233201234567', joinedAt: '2024-03-13', lastLogin: '2024-03-18', status: 'active', emailVerified: true, coursesEnrolled: 8, totalSpent: 480 },
  { id: '5', name: 'David Kimani', email: 'david@example.com', role: 'instructor', country: 'Kenya', joinedAt: '2024-03-12', lastLogin: '2024-03-10', status: 'suspended', emailVerified: true, coursesCreated: 2, totalEarned: 8500 },
  { id: '6', name: 'Amina Hassan', email: 'amina@example.com', role: 'student', country: 'Tanzania', phone: '+255712345678', joinedAt: '2024-03-11', lastLogin: '2024-03-17', status: 'active', emailVerified: true, coursesEnrolled: 3, totalSpent: 120 },
  { id: '7', name: 'Peter Okonkwo', email: 'peter@example.com', role: 'instructor', country: 'Nigeria', joinedAt: '2024-03-10', status: 'active', emailVerified: true, coursesCreated: 5, totalEarned: 25000 },
  { id: '8', name: 'Fatima Diallo', email: 'fatima@example.com', role: 'student', country: 'Senegal', joinedAt: '2024-03-09', status: 'banned', emailVerified: false },
  { id: '9', name: 'James Banda', email: 'james@example.com', role: 'admin', country: 'Zambia', joinedAt: '2024-02-01', lastLogin: '2024-03-20', status: 'active', emailVerified: true },
  { id: '10', name: 'Rose Nkomo', email: 'rose@example.com', role: 'student', country: 'South Africa', phone: '+27821234567', joinedAt: '2024-03-08', lastLogin: '2024-03-16', status: 'active', emailVerified: true, coursesEnrolled: 12, totalSpent: 890 },
];

const countries = ['Kenya', 'Nigeria', 'South Africa', 'Tanzania', 'Ghana', 'Uganda', 'Rwanda', 'Ethiopia', 'Senegal', 'Zambia'];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof User>('joinedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student' as User['role'],
    country: '',
    phone: '',
    status: 'active' as User['status'],
    sendWelcomeEmail: true,
  });

  const itemsPerPage = 10;

  // Filter and sort users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesCountry = countryFilter === 'all' || user.country === countryFilter;
    return matchesSearch && matchesRole && matchesStatus && matchesCountry;
  }).sort((a, b) => {
    const aVal = a[sortField] || '';
    const bVal = b[sortField] || '';
    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // CRUD Operations
  const handleCreateUser = () => {
    const newUser: User = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      role: formData.role,
      country: formData.country,
      phone: formData.phone || undefined,
      status: formData.status,
      joinedAt: new Date().toISOString().split('T')[0],
      emailVerified: false,
    };
    setUsers([newUser, ...users]);
    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdateUser = () => {
    if (!selectedUser) return;
    setUsers(users.map(u => 
      u.id === selectedUser.id 
        ? { ...u, ...formData }
        : u
    ));
    setIsEditOpen(false);
    setSelectedUser(null);
    resetForm();
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    setUsers(users.filter(u => u.id !== selectedUser.id));
    setIsDeleteOpen(false);
    setSelectedUser(null);
  };

  const handleStatusChange = (userId: string, newStatus: User['status']) => {
    setUsers(users.map(u => 
      u.id === userId ? { ...u, status: newStatus } : u
    ));
  };

  const handleBulkAction = () => {
    switch (bulkAction) {
      case 'activate':
        setUsers(users.map(u => 
          selectedUsers.includes(u.id) ? { ...u, status: 'active' } : u
        ));
        break;
      case 'suspend':
        setUsers(users.map(u => 
          selectedUsers.includes(u.id) ? { ...u, status: 'suspended' } : u
        ));
        break;
      case 'delete':
        setUsers(users.filter(u => !selectedUsers.includes(u.id)));
        break;
      case 'verify':
        setUsers(users.map(u => 
          selectedUsers.includes(u.id) ? { ...u, emailVerified: true } : u
        ));
        break;
    }
    setSelectedUsers([]);
    setIsBulkActionOpen(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'student',
      country: '',
      phone: '',
      status: 'active',
      sendWelcomeEmail: true,
    });
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      country: user.country,
      phone: user.phone || '',
      status: user.status,
      sendWelcomeEmail: false,
    });
    setIsEditOpen(true);
  };

  const openViewDialog = (user: User) => {
    setSelectedUser(user);
    setIsViewOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(paginatedUsers.map(u => u.id));
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-orange-100 text-orange-800';
      case 'banned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'instructor': return 'bg-indigo-100 text-indigo-800';
      case 'student': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    pending: users.filter(u => u.status === 'pending').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    students: users.filter(u => u.role === 'student').length,
    instructors: users.filter(u => u.role === 'instructor').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage all platform users</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the platform. They will receive a welcome email.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as User['role'] })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="instructor">Instructor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="country">Country</Label>
                    <Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map(country => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+255712345678"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="welcome" 
                    checked={formData.sendWelcomeEmail}
                    onCheckedChange={(checked) => setFormData({ ...formData, sendWelcomeEmail: !!checked })}
                  />
                  <Label htmlFor="welcome" className="text-sm font-normal">
                    Send welcome email with login instructions
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateUser} disabled={!formData.name || !formData.email}>
                  Create User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{stats.suspended}</div>
            <p className="text-xs text-muted-foreground">Suspended</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.students}</div>
            <p className="text-xs text-muted-foreground">Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-indigo-600">{stats.instructors}</div>
            <p className="text-xs text-muted-foreground">Instructors</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="instructor">Instructors</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="super_admin">Super Admins</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedUsers.length} selected
                </span>
                <Select value={bulkAction} onValueChange={(v) => { setBulkAction(v); setIsBulkActionOpen(true); }}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Bulk action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activate">Activate</SelectItem>
                    <SelectItem value="suspend">Suspend</SelectItem>
                    <SelectItem value="verify">Verify Email</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Email Verified</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => toggleSelectUser(user.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
                          <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.country}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.emailVerified ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>{new Date(user.joinedAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openViewDialog(user)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(user)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Key className="h-4 w-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.status === 'active' ? (
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(user.id, 'suspended')}
                              className="text-orange-600"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Suspend
                            </DropdownMenuItem>
                          ) : user.status === 'suspended' ? (
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(user.id, 'active')}
                              className="text-green-600"
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(user)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as User['role'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="instructor">Instructor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as User['status'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-country">Country</Label>
                <Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.name}`} />
                  <AvatarFallback>{selectedUser.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className={getRoleColor(selectedUser.role)}>
                      {selectedUser.role.replace('_', ' ')}
                    </Badge>
                    <Badge className={getStatusColor(selectedUser.status)}>
                      {selectedUser.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Country</p>
                  <p className="font-medium">{selectedUser.country}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedUser.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-medium">{new Date(selectedUser.joinedAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Login</p>
                  <p className="font-medium">{selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString() : 'Never'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Verified</p>
                  <p className="font-medium">{selectedUser.emailVerified ? 'Yes' : 'No'}</p>
                </div>
                {selectedUser.role === 'student' && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Courses Enrolled</p>
                      <p className="font-medium">{selectedUser.coursesEnrolled || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Spent</p>
                      <p className="font-medium">{formatCurrency(selectedUser.totalSpent || 0)}</p>
                    </div>
                  </>
                )}
                {selectedUser.role === 'instructor' && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Courses Created</p>
                      <p className="font-medium">{selectedUser.coursesCreated || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Earned</p>
                      <p className="font-medium">{formatCurrency(selectedUser.totalEarned || 0)}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setIsViewOpen(false); openEditDialog(selectedUser); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <Button variant="outline" size="sm">
                  <Key className="h-4 w-4 mr-2" />
                  Reset Password
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
              All their data, including enrollments and progress, will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog open={isBulkActionOpen} onOpenChange={setIsBulkActionOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {bulkAction} {selectedUsers.length} selected users?
              {bulkAction === 'delete' && ' This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBulkAction('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkAction}
              className={bulkAction === 'delete' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
