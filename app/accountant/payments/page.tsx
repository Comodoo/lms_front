'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { paymentsApi } from '@/lib/api';
import {
  CheckCircle,
  CreditCard,
  Download,
  Eye,
  Filter,
  Search,
  XCircle,
  Loader2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Payment {
  id: string;
  student_id?: string;
  registration_id?: string;
  student_name?: string;
  calculated_name?: string;
  registration?: {
    first_name?: string;
    last_name?: string;
  };
  student?: {
    name?: string;
  };
  fee_type: string;
  amount: number;
  method: string;
  status: 'pending' | 'completed' | 'failed';
  paid_at?: string;
  control_number?: string;
  notes?: string;
  processed_by?: string;
  created_at: string;
}

export default function AccountantPaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    setError(null);
    const response = await paymentsApi.getAll();
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setPayments(response.data as Payment[]);
    }
    setLoading(false);
  };

  const handleVerifyPayment = async (paymentId: string) => {
    const response = await paymentsApi.verifyCashPayment(paymentId, { notes: 'Verified by accountant' });
    if (response.error) {
      setError(response.error);
    } else {
      loadPayments();
    }
  };

  const filteredPayments = payments.map(payment => {
    // Determine student name from nested relations if not present directly
    let name = payment.student_name;
    if (!name && payment.registration) {
      name = `${payment.registration.first_name || ''} ${payment.registration.last_name || ''}`.trim();
    }
    if (!name && payment.student) {
      name = payment.student.name;
    }

    return { ...payment, calculated_name: name || 'N/A' };
  }).filter((payment) => {
    const searchString = searchTerm.toLowerCase();
    const matchesSearch =
      payment.calculated_name.toLowerCase().includes(searchString) ||
      String(payment.id).toLowerCase().includes(searchString) ||
      payment.control_number?.toLowerCase().includes(searchString);

    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const exportToExcel = () => {
    // Prepare the data mapping
    const data = filteredPayments.map(payment => ({
      'Payment ID': payment.id,
      'Control Number': payment.control_number || '',
      'Initiated Date': payment.created_at ? new Date(payment.created_at).toLocaleString() : '',
      'Paid Date': payment.paid_at ? new Date(payment.paid_at).toLocaleString() : '',
      'Student Name': payment.calculated_name || 'N/A',
      'Student ID': payment.student_id || '',
      'Fee Type': payment.fee_type,
      'Amount (TSH)': payment.amount,
      'Method': payment.method,
      'Status': payment.status
    }));

    // Create the worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set column widths to prevent "###" and make it readable
    const wscols = [
      { wch: 15 }, // Payment ID
      { wch: 20 }, // Control Number
      { wch: 22 }, // Initiated Date
      { wch: 22 }, // Paid Date
      { wch: 30 }, // Student Name
      { wch: 12 }, // Student ID
      { wch: 20 }, // Fee Type
      { wch: 15 }, // Amount (TSH)
      { wch: 15 }, // Method
      { wch: 12 }, // Status
    ];
    worksheet['!cols'] = wscols;

    // Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');

    // Trigger download of the xlsx file
    XLSX.writeFile(workbook, `payments_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'mpesa':
        return <span className="text-green-600 font-medium">M-Pesa</span>;
      case 'cash':
        return <span className="text-blue-600 font-medium">Cash</span>;
      case 'bank_transfer':
        return <span className="text-purple-600 font-medium">Bank</span>;
      case 'card':
        return <span className="text-orange-600 font-medium">Card</span>;
      default:
        return <span className="text-muted-foreground">{method}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <XCircle className="h-12 w-12 text-red-500" />
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={loadPayments} variant="outline">Retry</Button>
      </div>
    );
  }

  const totalAmount = filteredPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const pendingAmount = filteredPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const completedCount = filteredPayments.filter(p => p.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Management</h1>
          <p className="text-muted-foreground">View and manage all student payments</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={exportToExcel}>
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold break-all">TSH {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 ml-4">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Amount</p>
                <p className="text-2xl font-bold text-yellow-600 break-all">TSH {pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center shrink-0 ml-4">
                <Filter className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed Payments</p>
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student name, payment ID, or control number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Payments ({filteredPayments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Payment ID</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Fee Type</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Method</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="font-medium">{payment.id}</div>
                      {payment.control_number && <div className="text-xs text-muted-foreground">{payment.control_number}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{payment.calculated_name}</div>
                      {payment.student_id && <div className="text-xs text-muted-foreground">ID: {payment.student_id}</div>}
                    </td>
                    <td className="py-3 px-4">{payment.fee_type}</td>
                    <td className="py-3 px-4 font-medium">TSH {payment.amount.toLocaleString()}</td>
                    <td className="py-3 px-4">{getMethodIcon(payment.method)}</td>
                    <td className="py-3 px-4">{getStatusBadge(payment.status)}</td>
                    <td className="py-3 px-4 text-muted-foreground">{new Date(payment.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSelectedPayment(payment)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {payment.status === 'pending' && payment.method === 'cash' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                            onClick={() => handleVerifyPayment(payment.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No payments found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              View complete details for this payment record.
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Payment ID</p>
                  <p className="font-medium">{selectedPayment.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(selectedPayment.created_at).toLocaleString()}</p>
                </div>

                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Student</p>
                  <p className="font-medium">{selectedPayment.calculated_name}</p>
                  {selectedPayment.student_id && (
                    <p className="text-sm text-muted-foreground">ID: {selectedPayment.student_id}</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium text-lg text-primary">TSH {selectedPayment.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Fee Type</p>
                  <p className="font-medium capitalize">{selectedPayment.fee_type.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Method</p>
                  <div className="mt-1">{getMethodIcon(selectedPayment.method)}</div>
                </div>

                {selectedPayment.control_number && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Control Number</p>
                    <p className="font-mono bg-muted p-2 rounded-md mt-1">{selectedPayment.control_number}</p>
                  </div>
                )}

                {selectedPayment.notes && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="text-sm bg-muted/50 p-2 rounded-md mt-1">{selectedPayment.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

