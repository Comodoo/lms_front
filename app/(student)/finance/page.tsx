'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useRegistration } from '@/lib/registration-context';
import { apiClient } from '@/lib/api-client';
import { RegistrationPayment } from '@/lib/college-types';
import { CreditCard, Wallet, AlertCircle, FileText, Download, CheckCircle2, XCircle, Clock, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';

export default function FinancePage() {
  const { registrations } = useRegistration();
  const [payments, setPayments] = useState<RegistrationPayment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [semesterFilter, setSemesterFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<RegistrationPayment | null>(null);

  const currentRegistration = registrations[0];

  useEffect(() => {
    const fetchPayments = async () => {
      if (currentRegistration?.id) {
        setLoading(true);
        try {
          const data = await apiClient.getPaymentsByRegistration(currentRegistration.id).catch(() => []);
          setPayments(data || []);
        } catch (error) {
          console.error("Failed to fetch payments", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [currentRegistration?.id]);

  const handleDownloadReceipt = async () => {
    const element = document.getElementById('receipt-printable-area');
    if (!element) return;
    
    try {
      const imgData = await htmlToImage.toPng(element, { 
        pixelRatio: 2, 
        backgroundColor: '#ffffff' 
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const contentWidth = pdfWidth - (margin * 2);
      
      // Calculate aspect ratio height
      const rect = element.getBoundingClientRect();
      const contentHeight = (rect.height * contentWidth) / rect.width;
      
      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight);
      pdf.save(`receipt_${selectedReceipt?.controlNumber || 'payment'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
    }
  };

  // Extract unique years for the filter
  const uniqueYears = Array.from(new Set(payments.map(p => new Date(p.createdAt).getFullYear().toString()))).sort((a, b) => b.localeCompare(a));

  // Extract unique semesters from payment descriptions dynamically
  const uniqueSemesters = Array.from(new Set(payments.map(payment => {
    const descLower = (payment.description || '').toLowerCase();
    const fType = (payment.feeType || '').toLowerCase();
    if (descLower.includes('semester 1') || fType.includes('semester_1') || descLower.includes('first')) return '1';
    if (descLower.includes('semester 2') || fType.includes('semester_2') || descLower.includes('second')) return '2';
    if (descLower.includes('summer') || descLower.includes('semester 3') || fType.includes('semester_3')) return '3';
    return 'other';
  }))).filter(s => s !== 'other').sort();

  // Derived state
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const descLower = (payment.description || '').toLowerCase();
      const fType = (payment.feeType || '').toLowerCase();
      
      let semString = 'other';
      if (descLower.includes('semester 1') || fType.includes('semester_1') || descLower.includes('first')) semString = '1';
      else if (descLower.includes('semester 2') || fType.includes('semester_2') || descLower.includes('second')) semString = '2';
      else if (descLower.includes('summer') || descLower.includes('semester 3') || fType.includes('semester_3')) semString = '3';

      let matchesSemester = true;
      if (semesterFilter !== 'all') {
        matchesSemester = (semString === semesterFilter);
      }

      let matchesYear = true;
      const paymentYear = new Date(payment.createdAt).getFullYear().toString();
      if (yearFilter !== 'all') {
        matchesYear = paymentYear === yearFilter;
      }

      let matchesStatus = true;
      if (statusFilter !== 'all') {
        matchesStatus = payment.status === statusFilter;
      }

      return matchesSemester && matchesYear && matchesStatus;
    });
  }, [payments, semesterFilter, yearFilter, statusFilter]);

  const totalBilled = payments.reduce((acc, p) => acc + Number(p.amount), 0);
  const totalPaid = payments.filter(p => p.status === 'completed').reduce((acc, p) => acc + Number(p.amount), 0);
  const balance = totalBilled - totalPaid;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentRegistration) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center">
          <XCircle className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold">No Registration Found</h2>
        <p className="text-muted-foreground text-center max-w-md">
          You need to submit your registration before accessing financial records.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Financial Records</h1>
          <p className="text-muted-foreground mt-1">Manage your tuition fees and control numbers</p>
        </div>
        <Badge variant="outline" className="px-4 py-1.5 text-sm font-medium bg-white">
          Reg: {currentRegistration.registrationNumber || 'PENDING'}
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-blue-100">Total Billed</p>
                <h3 className="text-3xl font-bold mt-2">{totalBilled.toLocaleString()} TSH</h3>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-emerald-100">Total Paid</p>
                <h3 className="text-3xl font-bold mt-2">{totalPaid.toLocaleString()} TSH</h3>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-orange-100">Outstanding Balance</p>
                <h3 className="text-3xl font-bold mt-2">{balance.toLocaleString()} TSH</h3>
              </div>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Wallet className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 border-b pb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-xl">Fee Payments</CardTitle>
              <CardDescription>All your generated bills and their statuses.</CardDescription>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-[120px] bg-white">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {uniqueYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                <SelectTrigger className="w-[140px] bg-white">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {uniqueSemesters.map(sem => (
                    <SelectItem key={sem} value={sem}>
                      Semester {sem === '3' ? 'Summer' : sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-slate-50/50 uppercase">
                <tr>
                  <th className="px-6 py-4 font-medium">Fee Description</th>
                  <th className="px-6 py-4 font-medium">Academic Year</th>
                  <th className="px-6 py-4 font-medium">Control Number</th>
                  <th className="px-6 py-4 font-medium text-right">Amount (TSH)</th>
                  <th className="px-6 py-4 font-medium text-center">Status</th>
                  <th className="px-6 py-4 font-medium text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length === 0 && currentRegistration.status === 'pending' ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <Clock className="w-10 h-10 text-orange-400 mb-3" />
                        <h3 className="text-lg font-medium text-slate-700">Awaiting Approval</h3>
                        <p className="max-w-md mx-auto mt-2">Your registration is currently pending. Tuition and fee bills will be automatically generated once an accountant approves your registration.</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                        <p>No fee payments found matching your filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="bg-white hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{payment.description || payment.feeType}</div>
                        <div className="text-xs text-slate-500 mt-0.5">ID: #{payment.id}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(payment.createdAt).getFullYear()}/{new Date(payment.createdAt).getFullYear() + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-700 text-xs font-semibold inline-block border">
                          {payment.controlNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-700">
                        {Number(payment.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge 
                          className={`font-medium ${
                            payment.status === 'completed' 
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200' 
                              : 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200'
                          }`}
                        >
                          {payment.status === 'completed' ? 'PAID' : 'PENDING'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-blue-600"
                          disabled={payment.status !== 'completed'}
                          onClick={() => setSelectedReceipt(payment)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Modal */}
      <Dialog open={!!selectedReceipt} onOpenChange={(open) => !open && setSelectedReceipt(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
            <DialogDescription>
              Official receipt for {selectedReceipt?.description || selectedReceipt?.feeType}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReceipt && (
            <div id="receipt-printable-area" className="p-4 border rounded-lg bg-white mt-4 space-y-4">
              <div className="text-center border-b pb-4 mb-4 flex flex-col items-center">
                <img src="/LOGO.png" alt="College Logo" className="h-16 mb-2 object-contain" crossOrigin="anonymous" />
                <h2 className="text-xl font-bold uppercase tracking-wide">Zanzibar Metropolitan College (ZMC)</h2>
                <p className="text-sm text-slate-500">Official Payment Receipt</p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt No:</span>
                  <span className="font-mono font-medium">#{selectedReceipt.id.toString().padStart(6, '0')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-medium">
                    {new Date(selectedReceipt.paidAt || selectedReceipt.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Control Number:</span>
                  <span className="font-mono font-medium">{selectedReceipt.controlNumber}</span>
                </div>
                <div className="flex justify-between pt-2 border-t mt-2">
                  <span className="text-slate-500">Student ID:</span>
                  <span className="font-medium">{currentRegistration?.registrationNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Description:</span>
                  <span className="font-medium">{selectedReceipt.description || selectedReceipt.feeType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-medium text-emerald-600 uppercase">{selectedReceipt.status}</span>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">Total Amount:</span>
                  <span className="text-lg font-bold text-slate-900">
                    {Number(selectedReceipt.amount).toLocaleString()} TSH
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setSelectedReceipt(null)}>
              Close
            </Button>
            <Button onClick={handleDownloadReceipt} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4" />
              Download Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
