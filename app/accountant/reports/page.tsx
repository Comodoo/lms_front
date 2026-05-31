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

export default function AccountantReportsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

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
    if (selectedPeriod === '2024') return paymentDate.getFullYear() === 2024;
    // other filters can be implemented here
    return true; 
  });

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
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="april-2024">April 2024</SelectItem>
              <SelectItem value="march-2024">March 2024</SelectItem>
              <SelectItem value="q1-2024">Q1 2024</SelectItem>
              <SelectItem value="2024">Year 2024</SelectItem>
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
                <Button className="w-full gap-2">
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
                  <Badge variant="outline">PDF</Badge>
                  <Badge variant="outline">Excel</Badge>
                </div>
                <Button className="w-full gap-2">
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
                  <Badge variant="outline">PDF</Badge>
                  <Badge variant="outline">Excel</Badge>
                  <Badge variant="outline">Charts</Badge>
                </div>
                <Button className="w-full gap-2">
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
                  <Badge variant="outline">PDF</Badge>
                  <Badge variant="outline">Charts</Badge>
                </div>
                <Button className="w-full gap-2">
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

