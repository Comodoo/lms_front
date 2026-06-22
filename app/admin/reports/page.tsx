'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { paymentsApi, registrationsApi } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  PieChart,
} from 'lucide-react';
import { exportReportData } from '@/lib/export-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AdminReportsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [programs, setPrograms] = useState<any[]>([]);

  // Filters
  const [filterYear, setFilterYear] = useState('all');
  const [filterSemester, setFilterSemester] = useState('all');
  const [filterStudentYear, setFilterStudentYear] = useState('all');
  const [filterProgram, setFilterProgram] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [paymentsRes, registrationsRes, programsRes] = await Promise.all([
          paymentsApi.getAll(),
          registrationsApi.getAll(),
          apiClient.getPrograms()
        ]);
        
        if (paymentsRes.data) setPayments(paymentsRes.data as any[]);
        if (registrationsRes.data) setRegistrations(registrationsRes.data as any[]);
        if (programsRes) setPrograms(programsRes as any[]);
      } catch (error) {
        console.error("Failed to load reports data", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter payments by selected period
  const filteredPayments = payments.filter((p) => {
    const paymentYear = new Date(p.created_at || p.paid_at).getFullYear().toString();
    if (filterYear !== 'all' && paymentYear !== filterYear) return false;

    if (filterSemester !== 'all') {
      const desc = (p.description || '').toLowerCase();
      if (filterSemester === '1' && !desc.includes('semester 1') && !desc.includes('sem 1')) return false;
      if (filterSemester === '2' && !desc.includes('semester 2') && !desc.includes('sem 2')) return false;
    }

    if (filterProgram !== 'all' && p.registration?.program_id?.toString() !== filterProgram) {
      return false;
    }

    if (filterStudentYear !== 'all') {
      const regYear = new Date(p.registration?.created_at || p.created_at).getFullYear();
      const studentYear = (parseInt(paymentYear) - regYear) + 1;
      if (studentYear.toString() !== filterStudentYear) return false;
    }

    return true;
  });

  const exportPaymentSummary = (format: 'pdf' | 'excel' | 'csv') => {
    const data = filteredPayments.map(p => {
      let name = p.student_name;
      if (!name && p.registration) {
        name = `${p.registration.first_name || ''} ${p.registration.last_name || ''}`.trim();
      }
      if (!name && p.student) {
        name = p.student.name;
      }

      return {
        'Payment ID': p.id,
        'Student Name': name || 'Unknown',
        'Student ID': p.student_id || '',
        'Date': p.paid_at ? new Date(p.paid_at).toLocaleString() : (p.created_at ? new Date(p.created_at).toLocaleString() : ''),
        'Amount': p.amount,
        'Fee Type': p.fee_type,
        'Method': p.method,
        'Status': p.status
      };
    });

    const cols = [
      {wch: 15}, {wch: 30}, {wch: 15}, {wch: 25}, {wch: 15}, {wch: 20}, {wch: 15}, {wch: 15}
    ];
    exportReportData(format, data, 'Payment Summary', `Payment_Summary_${filterYear !== 'all' ? filterYear : 'All'}`, cols);
  };

  const exportOutstandingFees = (format: 'pdf' | 'excel' | 'csv') => {
    const data: any[] = [];
    registrations.forEach(reg => {
      const regPayments = reg.payments || [];
      const totalDue = regPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      const totalPaid = regPayments
        .filter((p: any) => p.status === 'completed')
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      const outstanding = totalDue - totalPaid;

      if (outstanding > 0) {
        data.push({
          'Student Name': `${reg.first_name || ''} ${reg.last_name || ''}`.trim() || 'Unknown',
          'Phone': reg.phone || 'N/A',
          'Email': reg.email || 'N/A',
          'Program': reg.program_name || reg.course?.name || 'General',
          'Total Due': totalDue,
          'Total Paid': totalPaid,
          'Outstanding Balance': outstanding
        });
      }
    });

    const cols = [{wch: 25}, {wch: 15}, {wch: 25}, {wch: 20}, {wch: 15}, {wch: 15}, {wch: 20}];
    exportReportData(format, data, 'Outstanding Fees', `Outstanding_Fees_${filterYear !== 'all' ? filterYear : 'All'}`, cols);
  };

  const exportRevenueByProgram = (format: 'pdf' | 'excel' | 'csv') => {
    const programRevenue: Record<string, number> = {};
    
    completedPayments.forEach(p => {
      let program = 'Unknown Program';
      const reg = registrations.find(r => r.id === p.registration_id);
      if (reg) {
        program = reg.program_name || reg.course?.name || 'General Program';
      }
      programRevenue[program] = (programRevenue[program] || 0) + Number(p.amount);
    });

    const data = Object.entries(programRevenue).map(([program, amount]) => ({
      'Program': program,
      'Total Revenue': amount
    }));

    const cols = [{wch: 30}, {wch: 20}];
    exportReportData(format, data, 'Revenue By Program', `Revenue_By_Program_${filterYear !== 'all' ? filterYear : 'All'}`, cols);
  };

  const exportMonthlyTrend = (format: 'pdf' | 'excel' | 'csv') => {
    const monthlyData: Record<string, { revenue: number, count: number }> = {};
    
    completedPayments.forEach(p => {
      const date = new Date(p.paid_at || p.created_at);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { revenue: 0, count: 0 };
      }
      monthlyData[monthYear].revenue += Number(p.amount);
      monthlyData[monthYear].count += 1;
    });

    const data = Object.entries(monthlyData).map(([month, stats]) => ({
      'Month': month,
      'Total Revenue': stats.revenue,
      'Number of Payments': stats.count,
      'Average Payment': stats.count > 0 ? Math.round(stats.revenue / stats.count) : 0
    }));

    const cols = [{wch: 20}, {wch: 20}, {wch: 20}, {wch: 20}];
    exportReportData(format, data, 'Monthly Trend', `Monthly_Trend_${filterYear !== 'all' ? filterYear : 'All'}`, cols);
  };

  const completedPayments = filteredPayments.filter(p => p.status === 'completed');
  
  const totalRevenue = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  
  const tuitionFees = completedPayments
    .filter(p => p.fee_type === 'tuition' || p.fee_type === 'tuition_fee')
    .reduce((sum, p) => sum + Number(p.amount), 0);
    
  const otherFees = totalRevenue - tuitionFees;

  let outstanding = 0;
  registrations.forEach(reg => {
    const regPayments = reg.payments || [];
    const totalDue = regPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const totalPaid = regPayments
      .filter((p: any) => p.status === 'completed')
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    outstanding += (totalDue - totalPaid);
  });

  // Calculate Fee Type Breakdown
  const feeTypeMap: Record<string, number> = {};
  completedPayments.forEach(p => {
    const type = p.fee_type || 'other';
    feeTypeMap[type] = (feeTypeMap[type] || 0) + Number(p.amount);
  });

  const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-purple-500', 'bg-gray-500'];
  
  const feeBreakdown = Object.entries(feeTypeMap)
    .sort((a, b) => b[1] - a[1])
    .map(([type, amount], index) => ({
      type: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      amount,
      percentage: totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0,
      color: colors[index % colors.length]
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financial Reports</h1>
          <p className="text-muted-foreground">Generate and download financial reports</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-4 md:mt-0">
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
          </Select>
          
          <Select value={filterSemester} onValueChange={setFilterSemester}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              <SelectItem value="1">Semester 1</SelectItem>
              <SelectItem value="2">Semester 2</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStudentYear} onValueChange={setFilterStudentYear}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Student Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Student Years</SelectItem>
              <SelectItem value="1">Year 1</SelectItem>
              <SelectItem value="2">Year 2</SelectItem>
              <SelectItem value="3">Year 3</SelectItem>
              <SelectItem value="4">Year 4</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterProgram} onValueChange={setFilterProgram}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programs.map(p => (
                <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">TSH {(totalRevenue / 1000000).toFixed(1)}M</p>
                    <div className="flex items-center text-xs mt-1 text-muted-foreground">
                      Total confirmed payments
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tuition Fees</p>
                    <p className="text-2xl font-bold">TSH {(tuitionFees / 1000000).toFixed(1)}M</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Other Fees</p>
                    <p className="text-2xl font-bold">TSH {(otherFees / 1000000).toFixed(1)}M</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <PieChart className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Outstanding</p>
                    <p className="text-2xl font-bold">TSH {outstanding >= 1000000 ? (outstanding / 1000000).toFixed(1) + 'M' : (outstanding / 1000).toFixed(0) + 'K'}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Available Reports */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Payment Summary Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Comprehensive overview of all payments received, categorized by fee type and payment method.
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline">PDF</Badge>
                  <Badge variant="outline">Excel</Badge>
                  <Badge variant="outline">CSV</Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="w-full gap-2">
                      <Download className="h-4 w-4" />
                      Download Report
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full min-w-[200px]">
                    <DropdownMenuItem onClick={() => exportPaymentSummary('pdf')}>Export as PDF (.pdf)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportPaymentSummary('excel')}>Export as Excel (.xlsx)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportPaymentSummary('csv')}>Export as CSV (.csv)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Outstanding Fees Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  List of students with outstanding fee balances, including contact details and amounts due.
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline">PDF</Badge>
                  <Badge variant="outline">Excel</Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="w-full gap-2">
                      <Download className="h-4 w-4" />
                      Download Report
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full min-w-[200px]">
                    <DropdownMenuItem onClick={() => exportOutstandingFees('pdf')}>Export as PDF (.pdf)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportOutstandingFees('excel')}>Export as Excel (.xlsx)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportOutstandingFees('csv')}>Export as CSV (.csv)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Revenue by Program
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Breakdown of revenue generated from each academic program and department.
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline">PDF</Badge>
                  <Badge variant="outline">Excel</Badge>
                  <Badge variant="outline">Charts</Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="w-full gap-2">
                      <Download className="h-4 w-4" />
                      Download Report
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full min-w-[200px]">
                    <DropdownMenuItem onClick={() => exportRevenueByProgram('pdf')}>Export as PDF (.pdf)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportRevenueByProgram('excel')}>Export as Excel (.xlsx)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportRevenueByProgram('csv')}>Export as CSV (.csv)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Monthly Trend Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Historical payment trends and projections for financial planning.
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline">PDF</Badge>
                  <Badge variant="outline">Charts</Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="w-full gap-2">
                      <Download className="h-4 w-4" />
                      Download Report
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full min-w-[200px]">
                    <DropdownMenuItem onClick={() => exportMonthlyTrend('pdf')}>Export as PDF (.pdf)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportMonthlyTrend('excel')}>Export as Excel (.xlsx)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportMonthlyTrend('csv')}>Export as CSV (.csv)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          </div>

          {/* Fee Type Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Fee Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feeBreakdown.length > 0 ? feeBreakdown.map((item) => (
                  <div key={item.type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.type}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">TSH {item.amount.toLocaleString()}</span>
                        <span className="font-medium w-12 text-right">{item.percentage}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">No payment data available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

