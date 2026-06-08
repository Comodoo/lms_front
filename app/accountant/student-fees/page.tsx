'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ChevronDown, ChevronUp, CheckCircle, Clock, AlertCircle, Loader2, Printer, CheckCircle2, Receipt } from 'lucide-react';
import { registrationsApi, paymentsApi } from '@/lib/api';
import Swal from 'sweetalert2';

export default function StudentFeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Table expansion state
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  
  // Receipt state
  const [receiptData, setReceiptData] = useState<{student: any, payment: any} | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await registrationsApi.getAll();
      if (response.data) {
        // Map and calculate totals
        const dataArr = Array.isArray(response.data) ? response.data : (response.data as any)?.data || [];
        const formatted = dataArr.map((reg: any) => {
          const payments = reg.payments || [];
          const totalDue = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
          const totalPaid = payments
            .filter((p: any) => p.status === 'completed')
            .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
            
          return {
            ...reg,
            registration_number: reg.registration_number || `ZMC-${String(new Date(reg.created_at || Date.now()).getFullYear()).slice(-2)}-01-${String(reg.id).padStart(4, '0')}`,
            totalDue,
            totalPaid,
            balance: totalDue - totalPaid,
            paymentPercentage: totalDue > 0 ? (totalPaid / totalDue) * 100 : 0,
          };
        });
        setStudents(formatted);
      }
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleApprovePayment = async (payment: any, student: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row toggle
    try {
      Swal.fire({
        title: 'Processing...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });
      
      const res = await paymentsApi.verifyCashPayment(payment.id, { notes: 'Approved by accountant' });
      
      if (res.error) {
        Swal.fire('Error', res.error, 'error');
        return;
      }
      
      Swal.close();
      
      // Update local state to immediately show completed before refreshing fully
      setStudents(prev => prev.map(s => {
        if (s.id === student.id) {
          const updatedPayments = (s.payments || []).map((p: any) => p.id === payment.id ? { ...p, status: 'completed', paid_at: new Date().toISOString() } : p);
          const totalPaid = updatedPayments.filter((p: any) => p.status === 'completed').reduce((sum: number, p: any) => sum + Number(p.amount), 0);
          return { ...s, payments: updatedPayments, totalPaid, balance: s.totalDue - totalPaid };
        }
        return s;
      }));

      // Set Receipt data and open modal
      setReceiptData({
        student,
        payment: { ...payment, status: 'completed', paid_at: new Date().toISOString() }
      });
      setIsReceiptOpen(true);
      
      // Fetch in background to ensure sync
      fetchStudents();
    } catch (error: any) {
      Swal.fire('Error', error.message || 'Action failed', 'error');
    }
  };

  const openReceipt = (payment: any, student: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setReceiptData({ student, payment });
    setIsReceiptOpen(true);
  };

  const printReceipt = () => {
    window.print();
  };

  const filteredStudents = students.filter((student) => {
    const search = searchTerm.toLowerCase();
    const name = `${student.first_name} ${student.last_name}`.toLowerCase();
    return (
      name.includes(search) ||
      (student.registration_number?.toLowerCase() || '').includes(search) ||
      (student.email?.toLowerCase() || '').includes(search)
    );
  });

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 100) return <Badge className="bg-green-100 text-green-800 border-green-200">Fully Paid</Badge>;
    if (percentage > 0) return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Partially Paid</Badge>;
    return <Badge className="bg-red-100 text-red-800 border-red-200">Payment Due</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 print:p-0 print:m-0 print:bg-white print:space-y-0">
      
      {/* Hide Header and Search in Print Mode */}
      <div className="print:hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Student Fee Management</h1>
            <p className="text-muted-foreground mt-1">Review student accounts, expand rows for details, and approve payments.</p>
          </div>
        </div>

        <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by student name, Reg ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-lg border-muted-foreground/20 focus-visible:ring-primary/50"
              />
            </div>
          </CardContent>
        </Card>

        {loading && students.length === 0 ? (
          <div className="flex justify-center items-center h-[50vh]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground font-medium animate-pulse">Loading financial records...</p>
            </div>
          </div>
        ) : (
          <Card className="shadow-lg border-muted-foreground/10 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead className="text-right">Total Due</TableHead>
                    <TableHead className="text-right">Total Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No students found matching your search.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => (
                      <React.Fragment key={student.id}>
                        <TableRow 
                          className={`cursor-pointer transition-colors hover:bg-muted/50 ${expandedRows[student.id] ? 'bg-muted/20 border-b-0' : ''}`}
                          onClick={() => toggleRow(student.id)}
                        >
                          <TableCell className="p-4">
                            {expandedRows[student.id] ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-foreground">{student.first_name} {student.last_name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{student.registration_number || 'No Reg Number'}</div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{student.program_name}</TableCell>
                          <TableCell className="text-right font-medium">TSH {student.totalDue.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-medium text-green-600">TSH {student.totalPaid.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-bold text-red-500">TSH {student.balance.toLocaleString()}</TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(student.paymentPercentage)}
                          </TableCell>
                        </TableRow>

                        {/* Unfolded Row */}
                        {expandedRows[student.id] && (
                          <TableRow className="bg-muted/5 hover:bg-muted/5">
                            <TableCell colSpan={7} className="p-0 border-b border-muted-foreground/20">
                              <div className="p-6 ml-12 border-l-2 border-primary/20 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
                                  Transaction Details
                                  <Badge variant="outline" className="font-normal bg-white">{student.payments?.length || 0} Records</Badge>
                                </h4>
                                
                                {student.payments && student.payments.length > 0 ? (
                                  <div className="rounded-md border bg-white">
                                    <Table>
                                      <TableHeader className="bg-muted/30">
                                        <TableRow>
                                          <TableHead>Fee Type</TableHead>
                                          <TableHead>Control Number</TableHead>
                                          <TableHead>Amount</TableHead>
                                          <TableHead>Status</TableHead>
                                          <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {student.payments.map((payment: any) => (
                                          <TableRow key={payment.id} className={payment.status === 'pending' ? 'bg-yellow-50/50' : ''}>
                                            <TableCell className="font-semibold capitalize">{payment.fee_type?.replace(/_/g, ' ')}</TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">{payment.control_number}</TableCell>
                                            <TableCell className="font-bold">TSH {Number(payment.amount).toLocaleString()}</TableCell>
                                            <TableCell>
                                              <Badge variant="outline" className={payment.status === 'completed' ? 'text-green-700 bg-green-50 border-green-200' : payment.status === 'pending' ? 'text-yellow-700 bg-yellow-50 border-yellow-200' : ''}>
                                                {payment.status}
                                              </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                              {payment.status === 'pending' ? (
                                                <Button 
                                                  size="sm" 
                                                  className="bg-primary hover:bg-primary/90 transition-transform active:scale-95"
                                                  onClick={(e) => handleApprovePayment(payment, student, e)}
                                                >
                                                  <CheckCircle className="h-4 w-4 mr-2" />
                                                  Approve
                                                </Button>
                                              ) : (
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="text-muted-foreground hover:text-foreground"
                                                  onClick={(e) => openReceipt(payment, student, e)}
                                                >
                                                  <Printer className="h-4 w-4 mr-2" />
                                                  Receipt
                                                </Button>
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <div className="text-center p-6 bg-white rounded-xl border border-dashed text-muted-foreground">
                                    No transactions available for this student.
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>

      {/* Official Receipt Modal */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-md sm:max-w-lg p-0 border-none bg-transparent shadow-none print:m-0 print:max-w-none print:w-full">
          
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible flex flex-col">
            {/* Header (Hidden in print) */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-white print:hidden">
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                <Receipt className="h-5 w-5" /> Official Receipt
              </DialogTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={printReceipt} className="gap-2">
                  <Printer className="h-4 w-4" /> Print / Save PDF
                </Button>
              </div>
            </div>

            {receiptData && (
              <div className="p-8 print:p-0 relative bg-white">
                
                {/* Official Header */}
                <div className="text-center space-y-2 mb-8 border-b-2 border-dashed pb-6">
                  <div className="mx-auto flex items-center justify-center mb-4">
                    <img src="/LOGO.png" alt="College Logo" className="h-20 object-contain" />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-widest text-primary">Official Receipt</h2>
                  <div className="flex flex-col items-center justify-center space-y-1 mt-2 mb-4">
                    <p className="text-foreground font-bold text-lg uppercase">Zanzibar Metropolitan College</p>
                    <p className="text-muted-foreground text-sm">Off Fumba Road, Mawasiliano</p>
                    <p className="text-muted-foreground text-sm">Kisauni, Zanzibar</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">Receipt No: #{receiptData.payment.id}-{Math.floor(Math.random() * 10000)}</p>
                </div>

                {/* Details Grid */}
                <div className="space-y-4 text-sm mb-8">
                  <div className="grid grid-cols-2 pb-2 border-b">
                    <span className="text-muted-foreground font-medium">Student Name:</span>
                    <span className="font-bold text-right">{receiptData.student.first_name} {receiptData.student.last_name}</span>
                  </div>
                  <div className="grid grid-cols-2 pb-2 border-b">
                    <span className="text-muted-foreground font-medium">Registration No:</span>
                    <span className="font-bold text-right">{receiptData.student.registration_number || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-2 pb-2 border-b">
                    <span className="text-muted-foreground font-medium">Fee Type:</span>
                    <span className="font-bold text-right capitalize">{receiptData.payment.fee_type?.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="grid grid-cols-2 pb-2 border-b">
                    <span className="text-muted-foreground font-medium">Payment Method:</span>
                    <span className="font-bold text-right capitalize">{receiptData.payment.method?.replace('_', ' ')}</span>
                  </div>
                  <div className="grid grid-cols-2 pb-2 border-b">
                    <span className="text-muted-foreground font-medium">Control Number:</span>
                    <span className="font-bold text-right font-mono">{receiptData.payment.control_number}</span>
                  </div>
                  <div className="grid grid-cols-2 pb-2 border-b">
                    <span className="text-muted-foreground font-medium">Date Processed:</span>
                    <span className="font-bold text-right">
                      {new Date(receiptData.payment.paid_at || new Date()).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Amount Box */}
                <div className="bg-muted/30 rounded-xl p-6 flex items-center justify-between mb-8 border border-muted-foreground/10">
                  <span className="text-muted-foreground font-semibold uppercase tracking-wider text-sm">Amount Paid</span>
                  <span className="text-3xl font-black text-primary">TSH {Number(receiptData.payment.amount).toLocaleString()}</span>
                </div>

                {/* Footer Stamp */}
                <div className="text-center mt-12 pt-8 border-t space-y-1">
                  <p className="text-xs text-muted-foreground">This is an electronically generated receipt.</p>
                  <p className="text-[10px] text-muted-foreground/50">Issued on {new Date().toLocaleString()}</p>
                </div>

                {/* Decorative Background Stamp */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none rotate-[-30deg]">
                   <span className="text-8xl font-black uppercase">PAID</span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          [role="dialog"], [role="dialog"] * {
            visibility: visible;
          }
          [role="dialog"] {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
            width: 100%;
          }
        }
      `}} />
    </div>
  );
}
