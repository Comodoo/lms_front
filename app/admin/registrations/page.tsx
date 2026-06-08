'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import type { StudentRegistration } from '@/lib/college-types';
import { RegistrationStatus } from '@/lib/college-types';
import { useRegistration } from '@/lib/registration-context';
import { CheckCircle2, Download, Eye, Filter, PlusCircle, Search, Trash2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function RegistrationsPage() {
  const router = useRouter();
  const { registrations, getRegistrations, approveRegistration, rejectRegistration, deleteRegistration, loading } = useRegistration();
  const { isAuthenticated, isLoading } = useAuth();
  
  const [filteredRegistrations, setFilteredRegistrations] = useState<StudentRegistration[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRegistration, setSelectedRegistration] = useState<StudentRegistration | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadRegistrations();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    filterRegistrations();
  }, [registrations, searchTerm, statusFilter]);

  const loadRegistrations = async () => {
    await getRegistrations();
  };

  const filterRegistrations = () => {
    let filtered = registrations;

    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.nationalId.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    setFilteredRegistrations(filtered);
  };

  const handleApprove = async (id: string) => {
    await approveRegistration(id);
    loadRegistrations();
  };

  const handleReject = async () => {
    if (selectedRegistration && rejectionReason) {
      await rejectRegistration(selectedRegistration.id, rejectionReason);
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedRegistration(null);
      loadRegistrations();
    }
  };

  const handleDelete = async () => {
    if (selectedRegistration) {
      await deleteRegistration(selectedRegistration.id);
      setDeleteDialogOpen(false);
      setSelectedRegistration(null);
      loadRegistrations();
    }
  };

  const getExportData = () => {
    return filteredRegistrations.map((r) => ({
      'Registration ID': r.id,
      'First Name': r.firstName,
      'Last Name': r.lastName,
      'Email': r.email,
      'Phone': r.phone,
      'National ID': r.nationalId,
      'Program': r.programName,
      'Intake': r.intake,
      'Status': r.status,
      'Submitted At': new Date(r.submittedAt).toLocaleString(),
    }));
  };

  const handleExportExcel = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const colWidths = [
      { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, 
      { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, 
      { wch: 15 }, { wch: 25 }
    ];
    ws['!cols'] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registrations');
    XLSX.writeFile(wb, `Student_Registrations_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportCSV = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Student_Registrations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    
    doc.text('Student Registrations Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    const data = getExportData();
    const headers = Object.keys(data[0] || {});
    const rows = data.map(obj => Object.values(obj).map(val => String(val)));

    autoTable(doc, {
      startY: 30,
      head: [headers],
      body: rows,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [13, 115, 119] }
    });

    doc.save(`Student_Registrations_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getStatusBadge = (status: RegistrationStatus) => {
    const variants: Record<RegistrationStatus, any> = {
      pending: 'secondary',
      under_review: 'default',
      approved: 'default',
      rejected: 'destructive',
      payment_pending: 'outline',
      payment_completed: 'default',
      registered: 'default',
    };

    const labels: Record<RegistrationStatus, string> = {
      pending: 'Pending',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
      payment_pending: 'Payment Pending',
      payment_completed: 'Payment Completed',
      registered: 'Registered',
    };

    return (
      <Badge variant={variants[status]} className="capitalize">
        {labels[status]}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-muted-foreground">Please log in to access registrations.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Student Registrations</h1>
          <p className="text-muted-foreground">Manage student registration applications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/admin')}>
            Back
          </Button>
          <Button onClick={() => router.push('/admin/registrations/new')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Registration
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registrations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {registrations.filter((r) => r.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {registrations.filter((r) => r.status === 'approved' || r.status === 'registered').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {registrations.filter((r) => r.status === 'rejected').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or national ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="payment_pending">Payment Pending</SelectItem>
                  <SelectItem value="payment_completed">Payment Completed</SelectItem>
                  <SelectItem value="registered">Registered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Choose Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportExcel}>
                  Export as Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Registrations Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Intake</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegistrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No registrations found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRegistrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell className="font-medium">
                      {registration.firstName} {registration.lastName}
                    </TableCell>
                    <TableCell>{registration.email}</TableCell>
                    <TableCell>{registration.programName}</TableCell>
                    <TableCell>{registration.intake}</TableCell>
                    <TableCell>{getStatusBadge(registration.status)}</TableCell>
                    <TableCell>
                      {new Date(registration.submittedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/registrations/${registration.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {(registration.status === 'pending' || registration.status === 'under_review') && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(registration.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRegistration(registration);
                                setRejectDialogOpen(true);
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRegistration(registration);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Registration</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this registration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason}>
              Reject Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Registration</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this registration? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
