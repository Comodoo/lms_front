'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Download, TrendingUp, CheckCircle, DollarSign, Plus, MoreHorizontal, Edit, Trash2, XCircle, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import Swal from 'sweetalert2';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';

// Ensure SweetAlert2 is always on top of Radix Dialogs
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .swal2-container {
      z-index: 99999 !important;
      pointer-events: auto !important;
    }
  `;
  document.head.appendChild(style);
}

export default function AdminPaymentsPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [fees, setFees] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [feeSearchTerm, setFeeSearchTerm] = useState('');

  // Fee Form State
  const [isFeeDialogOpen, setIsFeeDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<any>(null);
  const [feeForm, setFeeForm] = useState({
      name: '',
      type: 'tuition',
      program_id: '',
      applicable_semester: 'both',
      semester_1_amount: 0,
      semester_2_amount: 0,
      currency: 'TZS',
      description: '',
      is_active: true,
  });

  useEffect(() => {
    if (isAuthenticated) {
        fetchData();
    } else {
        setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
          // Pass true to getFees to fetch ALL fees (including inactive ones)
          const [feesRes, programsRes, paymentsRes] = await Promise.all([
              apiClient.getFees(undefined, true),
              apiClient.getPrograms(),
              apiClient.getPayments(),
          ]);
          setFees((feesRes as any[]) || []);
          setPrograms((programsRes as any[]) || []);
          setPayments((paymentsRes as any[]) || []);
      } catch (err: any) {
          setError(err.message || 'Failed to load data');
      }
      setLoading(false);
  };

  // ================= FEES LOGIC =================
  const handleSaveFee = async () => {
      try {
          const payload = {
              ...feeForm,
              program_id: feeForm.type === 'tuition' ? feeForm.program_id : null,
              semester_1_amount: feeForm.applicable_semester === 'semester_2' ? 0 : feeForm.semester_1_amount,
              semester_2_amount: feeForm.applicable_semester === 'semester_1' ? 0 : feeForm.semester_2_amount,
          };

          if (selectedFee) {
              await apiClient.updateFee(selectedFee.id, payload);
              Swal.fire('Updated!', 'Fee has been updated.', 'success');
          } else {
              await apiClient.createFee(payload);
              Swal.fire('Created!', 'Fee has been created.', 'success');
          }
          setIsFeeDialogOpen(false);
          fetchData();
      } catch (err: any) {
          Swal.fire('Error', err.message || 'Failed to save fee', 'error');
      }
  };

  const handleDeleteFee = async (id: string) => {
      const result = await Swal.fire({
          title: 'Are you sure?',
          text: "This fee will be deleted from the system.",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
          try {
              await apiClient.deleteFee(id);
              Swal.fire('Deleted!', 'Fee has been deleted.', 'success');
              fetchData();
          } catch (err: any) {
              Swal.fire('Error', err.message || 'Failed to delete fee', 'error');
          }
      }
  };

  const toggleFeeStatus = async (fee: any) => {
    try {
      const payload = {
        ...fee,
        is_active: !fee.is_active
      };
      await apiClient.updateFee(fee.id, payload);
      fetchData();
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Failed to update fee status', 'error');
    }
  };

  const openFeeDialog = (fee?: any) => {
      if (fee) {
          setSelectedFee(fee);
          setFeeForm({
              name: fee.name,
              type: fee.type,
              program_id: fee.program_id?.toString() || '',
              applicable_semester: fee.applicable_semester,
              semester_1_amount: fee.semester_1_amount,
              semester_2_amount: fee.semester_2_amount,
              currency: fee.currency || 'TZS',
              description: fee.description || '',
              is_active: fee.is_active,
          });
      } else {
          setSelectedFee(null);
          setFeeForm({
              name: '',
              type: 'tuition',
              program_id: '',
              applicable_semester: 'both',
              semester_1_amount: 0,
              semester_2_amount: 0,
              currency: 'TZS',
              description: '',
              is_active: true,
          });
      }
      setIsFeeDialogOpen(true);
  };

  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const completedRegistrations = payments.filter(p => p.status === 'completed').length;

  const filteredFees = fees.filter(
      (f) =>
          f.name.toLowerCase().includes(feeSearchTerm.toLowerCase())
  );

  if (!isAuthenticated) return null;

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
              <Button onClick={fetchData} variant="outline">Retry</Button>
          </div>
      );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Revenue & Payments</h1>
          <p className="text-muted-foreground">Monitor student fees, manage fee structures, and control numbers</p>
        </div>
      </div>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="mb-4">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="fees">Fee Registration</TabsTrigger>
        </TabsList>

        {/* ================= TRANSACTIONS TAB ================= */}
        <TabsContent value="transactions" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Financial Report
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Total Revenue (TSH)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold break-all">{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground mt-1">Confirmed collections</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Paid Registrations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{completedRegistrations}</div>
                <p className="text-xs text-muted-foreground mt-1">Students with complete registration</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Pending Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {payments.filter(p => p.status === 'pending').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Outstanding invoices</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>A list of all student fee payments and their statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Reg. Number</TableHead>
                    <TableHead>Fee Type</TableHead>
                    <TableHead>Control Number</TableHead>
                    <TableHead>Amount (TSH)</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.registration ? `${payment.registration.first_name} ${payment.registration.last_name}` : 'Unknown'}
                      </TableCell>
                      <TableCell>{payment.registration?.registration_number || (payment.registration ? `ZMC-${String(new Date(payment.registration.created_at || payment.created_at || Date.now()).getFullYear()).slice(-2)}-01-${String(payment.registration.id).padStart(4, '0')}` : 'N/A')}</TableCell>
                      <TableCell className="capitalize">{payment.fee_type?.replace(/_/g, ' ')}</TableCell>
                      <TableCell className="font-mono text-xs">{payment.control_number}</TableCell>
                      <TableCell>{Number(payment.amount).toLocaleString()}</TableCell>
                      <TableCell>{new Date(payment.paid_at || payment.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === 'completed' ? 'secondary' : 'outline'} className={payment.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' : ''}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {payments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                        No payments found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= FEES TAB ================= */}
        <TabsContent value="fees" className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search fees..."
                        value={feeSearchTerm}
                        onChange={(e) => setFeeSearchTerm(e.target.value)}
                        className="pl-10 h-9"
                    />
                </div>
                <Button onClick={() => openFeeDialog()} className="gap-2 h-9">
                    <Plus className="h-4 w-4" /> Create Fee
                </Button>
            </div>

            <Card>
                <CardHeader className="py-3">
                    <CardTitle className="text-sm font-semibold">Registered Fees ({filteredFees.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="text-left py-2 px-4 font-medium text-muted-foreground text-[10px] uppercase">Fee Name</th>
                                    <th className="text-left py-2 px-4 font-medium text-muted-foreground text-[10px] uppercase">Type</th>
                                    <th className="text-left py-2 px-4 font-medium text-muted-foreground text-[10px] uppercase">Program</th>
                                    <th className="text-left py-2 px-4 font-medium text-muted-foreground text-[10px] uppercase">Amount & Semesters</th>
                                    <th className="text-center py-2 px-4 font-medium text-muted-foreground text-[10px] uppercase">Status</th>
                                    <th className="text-left py-2 px-4 font-medium text-muted-foreground text-[10px] uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs">
                                {filteredFees.map((fee) => (
                                    <tr key={fee.id} className="border-b last:border-0 hover:bg-muted/30">
                                        <td className="py-2 px-4">
                                            <p className="font-semibold">{fee.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{fee.description}</p>
                                        </td>
                                        <td className="py-2 px-4">
                                            <Badge variant={fee.type === 'tuition' ? 'default' : 'secondary'} className="text-[10px]">
                                                {fee.type === 'tuition' ? 'Tuition' : 'Direct Cost'}
                                            </Badge>
                                        </td>
                                        <td className="py-2 px-4 text-xs">
                                            {fee.type === 'tuition' && fee.program ? fee.program.code : 'All Students'}
                                        </td>
                                        <td className="py-2 px-4">
                                            <div className="font-bold text-primary mb-1">
                                                {fee.currency} {parseFloat(fee.total_amount).toLocaleString()}
                                            </div>
                                            <div className="text-[10px] space-y-1">
                                              {fee.applicable_semester === 'both' || fee.applicable_semester === 'semester_1' ? (
                                                  <div className="flex justify-between w-24"><span>Sem 1:</span> <span className="font-medium">{parseFloat(fee.semester_1_amount).toLocaleString()}</span></div>
                                              ) : null}
                                              {fee.applicable_semester === 'both' || fee.applicable_semester === 'semester_2' ? (
                                                  <div className="flex justify-between w-24"><span>Sem 2:</span> <span className="font-medium">{parseFloat(fee.semester_2_amount).toLocaleString()}</span></div>
                                              ) : null}
                                            </div>
                                        </td>
                                        <td className="py-2 px-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                              <Switch 
                                                checked={fee.is_active} 
                                                onCheckedChange={() => toggleFeeStatus(fee)} 
                                              />
                                              <span className={`text-[10px] ${fee.is_active ? 'text-green-600' : 'text-muted-foreground'}`}>
                                                {fee.is_active ? 'Active' : 'Inactive'}
                                              </span>
                                            </div>
                                        </td>
                                        <td className="py-2 px-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openFeeDialog(fee)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => toggleFeeStatus(fee)}>
                                                        <CheckCircle className="mr-2 h-4 w-4" /> {fee.is_active ? 'Deactivate' : 'Activate'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDeleteFee(fee.id)} className="text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                                {filteredFees.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">No fees registered yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      {/* ================= FEE DIALOG ================= */}
      <Dialog open={isFeeDialogOpen} onOpenChange={setIsFeeDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                  <DialogTitle>{selectedFee ? 'Edit Fee' : 'Create Fee'}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="col-span-2 space-y-2">
                      <Label>Fee Name</Label>
                      <Input value={feeForm.name} onChange={(e) => setFeeForm({ ...feeForm, name: e.target.value })} placeholder="e.g. Semester Tuition Fee" />
                  </div>
                  
                  <div className="space-y-2">
                      <Label>Fee Type</Label>
                      <Select value={feeForm.type} onValueChange={(v) => setFeeForm({ ...feeForm, type: v })}>
                          <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="tuition">Tuition (Attached to Program)</SelectItem>
                              <SelectItem value="direct">Direct Cost (All Students)</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>

                  {feeForm.type === 'tuition' ? (
                      <div className="space-y-2">
                          <Label>Program</Label>
                          <Select value={feeForm.program_id} onValueChange={(v) => setFeeForm({ ...feeForm, program_id: v })}>
                              <SelectTrigger><SelectValue placeholder="Select Program" /></SelectTrigger>
                              <SelectContent>
                                  {programs.map((p: any) => (
                                      <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      </div>
                  ) : (
                      <div className="space-y-2 pt-8">
                          <p className="text-xs text-muted-foreground italic">Direct costs automatically apply to all students.</p>
                      </div>
                  )}

                  <div className="col-span-2 pt-4 pb-2 border-b">
                      <h4 className="font-semibold text-sm">Semester Breakdown</h4>
                      <p className="text-xs text-muted-foreground">Select which semester(s) this fee applies to.</p>
                  </div>

                  <div className="col-span-2 space-y-2 mb-4">
                      <Label>Applicable Semester</Label>
                      <Select value={feeForm.applicable_semester} onValueChange={(v) => setFeeForm({ ...feeForm, applicable_semester: v })}>
                          <SelectTrigger><SelectValue placeholder="Select Semester Coverage" /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="both">Both Semesters</SelectItem>
                              <SelectItem value="semester_1">Semester 1 Only</SelectItem>
                              <SelectItem value="semester_2">Semester 2 Only</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>

                  {(feeForm.applicable_semester === 'both' || feeForm.applicable_semester === 'semester_1') && (
                      <div className="space-y-2">
                          <Label>Semester 1 Amount</Label>
                          <Input type="number" value={feeForm.semester_1_amount} onChange={(e) => setFeeForm({ ...feeForm, semester_1_amount: parseFloat(e.target.value) || 0 })} />
                      </div>
                  )}

                  {(feeForm.applicable_semester === 'both' || feeForm.applicable_semester === 'semester_2') && (
                      <div className="space-y-2">
                          <Label>Semester 2 Amount</Label>
                          <Input type="number" value={feeForm.semester_2_amount} onChange={(e) => setFeeForm({ ...feeForm, semester_2_amount: parseFloat(e.target.value) || 0 })} />
                      </div>
                  )}

                  <div className="col-span-2 flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                    <div>
                      <Label className="text-base font-medium">Active Status</Label>
                      <p className="text-xs text-muted-foreground mt-1">If inactive, this fee won't be shown to students or charged during registration.</p>
                    </div>
                    <Switch 
                      checked={feeForm.is_active} 
                      onCheckedChange={(checked) => setFeeForm({ ...feeForm, is_active: checked })} 
                    />
                  </div>

                  <div className="col-span-2 space-y-2 mt-2">
                      <Label>Description (Optional)</Label>
                      <Textarea value={feeForm.description} onChange={(e) => setFeeForm({ ...feeForm, description: e.target.value })} placeholder="Details about what this fee covers..." />
                  </div>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-lg flex justify-between items-center border">
                  <span className="font-medium text-sm">Total Calculated Fee:</span>
                  <span className="text-lg font-bold text-primary">
                      {feeForm.currency} {((feeForm.applicable_semester === 'semester_2' ? 0 : feeForm.semester_1_amount) + (feeForm.applicable_semester === 'semester_1' ? 0 : feeForm.semester_2_amount)).toLocaleString()}
                  </span>
              </div>

              <DialogFooter className="mt-4">
                  <Button variant="outline" onClick={() => setIsFeeDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveFee}>Save Fee</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
