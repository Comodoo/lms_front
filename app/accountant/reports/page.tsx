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
import * as XLSX from 'xlsx';

export default function AccountantReportsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [paymentFormat, setPaymentFormat] = useState<string>('excel');
  const [outstandingFormat, setOutstandingFormat] = useState<string>('excel');
  const [revenueFormat, setRevenueFormat] = useState<string>('excel');
  const [trendFormat, setTrendFormat] = useState<string>('excel');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [paymentsRes, registrationsRes] = await Promise.all([
          paymentsApi.getAll(),
          registrationsApi.getAll()
        ]);
        
        if (paymentsRes.data) setPayments(paymentsRes.data as any[]);
        if (registrationsRes.data) setRegistrations(registrationsRes.data as any[]);
      } catch (error) {
        console.error("Failed to load reports data", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter payments by selected period
  const filteredPayments = payments.filter(p => {
    if (selectedPeriod === 'all') return true;
    const paymentDate = new Date(p.paid_at || p.created_at);
    
    if (selectedPeriod === 'ay-2024-2025') {
      return paymentDate >= new Date('2024-10-01') && paymentDate <= new Date('2025-09-30');
    }
    if (selectedPeriod === 'sem1-2024-2025') {
      return paymentDate >= new Date('2024-10-01') && paymentDate <= new Date('2025-02-28');
    }
    if (selectedPeriod === 'sem2-2024-2025') {
      return paymentDate >= new Date('2025-03-01') && paymentDate <= new Date('2025-09-30');
    }
    if (selectedPeriod === 'ay-2023-2024') {
      return paymentDate >= new Date('2023-10-01') && paymentDate <= new Date('2024-09-30');
    }
    if (selectedPeriod === 'sem1-2023-2024') {
      return paymentDate >= new Date('2023-10-01') && paymentDate <= new Date('2024-02-29');
    }
    if (selectedPeriod === 'sem2-2023-2024') {
      return paymentDate >= new Date('2024-03-01') && paymentDate <= new Date('2024-09-30');
    }

    // fallback for any old state values
    const year = paymentDate.getFullYear();
    const month = paymentDate.getMonth(); // 0-indexed
    if (selectedPeriod === '2024') return year === 2024;
    if (selectedPeriod === 'april-2024') return year === 2024 && month === 3;
    if (selectedPeriod === 'march-2024') return year === 2024 && month === 2;
    if (selectedPeriod === 'q1-2024') return year === 2024 && month >= 0 && month <= 2;
    
    return true; 
  });

  const generatePdfHeader = async (doc: any, title: string) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    const loadImage = (url: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
      });
    };

    let logoImg: HTMLImageElement | null = null;
    try {
      logoImg = await loadImage('/logo.png');
    } catch (e) {
      try { logoImg = await loadImage('/placeholder-logo.png'); } catch (e2) {}
    }

    doc.setFillColor(15, 118, 110);
    doc.rect(0, 0, pageWidth, 42, 'F');
    
    if (logoImg) {
      doc.addImage(logoImg, 'PNG', 14, 5, 26, 26);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('ZANZIBAR METROPOLITAN COLLEGE', pageWidth / 2, 18, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Off Fumba Road, Mawasiliano, Kisauni, Zanzibar', pageWidth / 2, 26, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(title, 14, 52);
    doc.setFontSize(10);
    doc.text(`Period: ${selectedPeriod === 'all' ? 'All Time' : selectedPeriod}`, 14, 58);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 64);
    
    doc.setDrawColor(15, 118, 110);
    doc.setLineWidth(0.5);
    doc.line(14, 68, pageWidth - 14, 68);
    
    return 74; // Return the Y position for the start of the table
  };

  const exportPaymentSummary = async () => {
    const data = filteredPayments.map(p => {
      // Calculate student name from relationships if needed
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

    if (paymentFormat === 'pdf') {
      try {
        const [jsPDFModule, autoTableModule] = await Promise.all([
          import('jspdf'),
          import('jspdf-autotable')
        ]);
        const jsPDF = jsPDFModule.default;
        const autoTable = autoTableModule.default;
        
        const doc = new jsPDF('landscape');
        const startY = await generatePdfHeader(doc, 'Payment Summary Report');
        
        autoTable(doc, {
          startY,
          head: [['Payment ID', 'Student Name', 'Student ID', 'Date', 'Amount', 'Fee Type', 'Method', 'Status']],
          body: data.map(row => [
            row['Payment ID'],
            row['Student Name'],
            row['Student ID'],
            row['Date'],
            row['Amount'],
            row['Fee Type'],
            row['Method'],
            row['Status']
          ]),
          headStyles: { fillColor: [15, 118, 110] }, // Match Teal color
          styles: { fontSize: 9 }
        });
        
        doc.save(`Payment_Summary_${selectedPeriod}.pdf`);
      } catch (error) {
        console.error("Failed to generate PDF", error);
      }
    } else if (paymentFormat === 'csv') {
      const ws = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Payment_Summary_${selectedPeriod}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [
        {wch: 15}, // Payment ID
        {wch: 30}, // Student Name
        {wch: 15}, // Student ID
        {wch: 25}, // Date
        {wch: 15}, // Amount
        {wch: 20}, // Fee Type
        {wch: 15}, // Method
        {wch: 15}  // Status
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Payment Summary');
      XLSX.writeFile(wb, `Payment_Summary_${selectedPeriod}.xlsx`);
    }
  };

  const exportOutstandingFees = async () => {
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

    if (outstandingFormat === 'pdf') {
      try {
        const [jsPDFModule, autoTableModule] = await Promise.all([
          import('jspdf'),
          import('jspdf-autotable')
        ]);
        const jsPDF = jsPDFModule.default;
        const autoTable = autoTableModule.default;
        
        const doc = new jsPDF('landscape');
        const startY = await generatePdfHeader(doc, 'Outstanding Fees Report');
        
        autoTable(doc, {
          startY,
          head: [['Student Name', 'Phone', 'Email', 'Program', 'Total Due', 'Total Paid', 'Outstanding Balance']],
          body: data.map(row => [
            row['Student Name'],
            row['Phone'],
            row['Email'],
            row['Program'],
            row['Total Due'],
            row['Total Paid'],
            row['Outstanding Balance']
          ]),
          headStyles: { fillColor: [15, 118, 110] },
          styles: { fontSize: 9 }
        });
        
        doc.save(`Outstanding_Fees_${selectedPeriod}.pdf`);
      } catch (error) {
        console.error("Failed to generate PDF", error);
      }
    } else {
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [{wch: 25}, {wch: 15}, {wch: 25}, {wch: 20}, {wch: 15}, {wch: 15}, {wch: 20}];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Outstanding Fees');
      XLSX.writeFile(wb, `Outstanding_Fees_${selectedPeriod}.xlsx`);
    }
  };

  const exportRevenueByProgram = async () => {
    const programRevenue: Record<string, number> = {};
    
    // Group completed payments by program
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

    if (revenueFormat === 'pdf') {
      try {
        const [jsPDFModule, autoTableModule] = await Promise.all([
          import('jspdf'),
          import('jspdf-autotable')
        ]);
        const jsPDF = jsPDFModule.default;
        const autoTable = autoTableModule.default;
        
        const doc = new jsPDF('portrait');
        const startY = await generatePdfHeader(doc, 'Revenue By Program Report');
        
        autoTable(doc, {
          startY,
          head: [['Program', 'Total Revenue']],
          body: data.map(row => [
            row['Program'],
            row['Total Revenue'].toLocaleString()
          ]),
          headStyles: { fillColor: [15, 118, 110] },
          styles: { fontSize: 10 }
        });
        
        doc.save(`Revenue_By_Program_${selectedPeriod}.pdf`);
      } catch (error) {
        console.error("Failed to generate PDF", error);
      }
    } else {
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [{wch: 30}, {wch: 20}];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Revenue By Program');
      XLSX.writeFile(wb, `Revenue_By_Program_${selectedPeriod}.xlsx`);
    }
  };

  const exportMonthlyTrend = async () => {
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

    if (trendFormat === 'pdf') {
      try {
        const [jsPDFModule, autoTableModule] = await Promise.all([
          import('jspdf'),
          import('jspdf-autotable')
        ]);
        const jsPDF = jsPDFModule.default;
        const autoTable = autoTableModule.default;
        
        const doc = new jsPDF('portrait');
        const startY = await generatePdfHeader(doc, 'Monthly Trend Analysis Report');
        
        autoTable(doc, {
          startY,
          head: [['Month', 'Total Revenue', 'Number of Payments', 'Average Payment']],
          body: data.map(row => [
            row['Month'],
            row['Total Revenue'].toLocaleString(),
            row['Number of Payments'].toLocaleString(),
            row['Average Payment'].toLocaleString()
          ]),
          headStyles: { fillColor: [15, 118, 110] },
          styles: { fontSize: 10 }
        });
        
        doc.save(`Monthly_Trend_${selectedPeriod}.pdf`);
      } catch (error) {
        console.error("Failed to generate PDF", error);
      }
    } else {
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [{wch: 20}, {wch: 20}, {wch: 20}, {wch: 20}];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Monthly Trend');
      XLSX.writeFile(wb, `Monthly_Trend_${selectedPeriod}.xlsx`);
    }
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
        <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[240px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="ay-2024-2025">Academic Year 2024/2025</SelectItem>
                <SelectItem value="sem1-2024-2025">-- Semester 1 (2024/2025)</SelectItem>
                <SelectItem value="sem2-2024-2025">-- Semester 2 (2024/2025)</SelectItem>
                <SelectItem value="ay-2023-2024">Academic Year 2023/2024</SelectItem>
                <SelectItem value="sem1-2023-2024">-- Semester 1 (2023/2024)</SelectItem>
                <SelectItem value="sem2-2023-2024">-- Semester 2 (2023/2024)</SelectItem>
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
                  <Badge 
                    className="cursor-pointer transition-colors" 
                    variant={paymentFormat === 'pdf' ? 'default' : 'outline'}
                    onClick={() => setPaymentFormat('pdf')}
                  >
                    PDF
                  </Badge>
                  <Badge 
                    className="cursor-pointer transition-colors" 
                    variant={paymentFormat === 'excel' ? 'default' : 'outline'}
                    onClick={() => setPaymentFormat('excel')}
                  >
                    Excel
                  </Badge>
                  <Badge 
                    className="cursor-pointer transition-colors" 
                    variant={paymentFormat === 'csv' ? 'default' : 'outline'}
                    onClick={() => setPaymentFormat('csv')}
                  >
                    CSV
                  </Badge>
                </div>
                <Button className="w-full gap-2" onClick={exportPaymentSummary}>
                  <Download className="h-4 w-4" />
                  Download Report
                </Button>
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
                  <Badge 
                    className="cursor-pointer transition-colors" 
                    variant={outstandingFormat === 'pdf' ? 'default' : 'outline'}
                    onClick={() => setOutstandingFormat('pdf')}
                  >
                    PDF
                  </Badge>
                  <Badge 
                    className="cursor-pointer transition-colors" 
                    variant={outstandingFormat === 'excel' ? 'default' : 'outline'}
                    onClick={() => setOutstandingFormat('excel')}
                  >
                    Excel
                  </Badge>
                </div>
                <Button className="w-full gap-2" onClick={exportOutstandingFees}>
                  <Download className="h-4 w-4" />
                  Download Report
                </Button>
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
                  <Badge 
                    className="cursor-pointer transition-colors" 
                    variant={revenueFormat === 'pdf' ? 'default' : 'outline'}
                    onClick={() => setRevenueFormat('pdf')}
                  >
                    PDF
                  </Badge>
                  <Badge 
                    className="cursor-pointer transition-colors" 
                    variant={revenueFormat === 'excel' ? 'default' : 'outline'}
                    onClick={() => setRevenueFormat('excel')}
                  >
                    Excel
                  </Badge>
                </div>
                <Button className="w-full gap-2" onClick={exportRevenueByProgram}>
                  <Download className="h-4 w-4" />
                  Download Report
                </Button>
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
                  <Badge 
                    className="cursor-pointer transition-colors" 
                    variant={trendFormat === 'pdf' ? 'default' : 'outline'}
                    onClick={() => setTrendFormat('pdf')}
                  >
                    PDF
                  </Badge>
                  <Badge 
                    className="cursor-pointer transition-colors" 
                    variant={trendFormat === 'excel' ? 'default' : 'outline'}
                    onClick={() => setTrendFormat('excel')}
                  >
                    Excel
                  </Badge>
                </div>
                <Button className="w-full gap-2" onClick={exportMonthlyTrend}>
                  <Download className="h-4 w-4" />
                  Download Report
                </Button>
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

