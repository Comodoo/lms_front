'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { paymentsApi, dashboardApi } from '@/lib/api';
import {
  CreditCard,
  TrendingUp,
  Users,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function AccountantDashboardPage() {
  const { user } = useAuth();

  const [payments, setPayments] = useState<any[]>([]);
  const [statsData, setStatsData] = useState<any>(null);
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
        const [paymentsRes, statsRes, programsRes] = await Promise.all([
          paymentsApi.getAll(),
          dashboardApi.getAccountantStats(),
          apiClient.getPrograms()
        ]);
        
        if (paymentsRes.data) setPayments(paymentsRes.data as any[]);
        if (statsRes.data) setStatsData(statsRes.data);
        if (programsRes) setPrograms(programsRes as any[]);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const filteredPayments = payments.filter((p) => {
    const paymentYear = new Date(p.created_at).getFullYear().toString();
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

  // Calculate dynamic stats
  const dynamicRevenue = filteredPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const dynamicPending = filteredPayments
    .filter(p => p.status === 'pending')
    .length;

  const dynamicTotal = filteredPayments.length;

  const stats = [
    {
      title: 'Filtered Revenue',
      value: `TSH ${dynamicRevenue.toLocaleString()}`,
      change: 'Based on filters',
      trend: dynamicRevenue > 0 ? 'up' : 'down',
      icon: CreditCard,
    },
    {
      title: 'Pending Verifications',
      value: dynamicPending.toString(),
      change: 'Action Required',
      trend: dynamicPending > 0 ? 'up' : 'down',
      icon: Receipt,
    },
    {
      title: 'Active Students',
      value: (statsData?.totalStudents || statsData?.activeStudents || 0).toString(),
      change: 'Total Registered',
      trend: 'up',
      icon: Users,
    },
    {
      title: 'Total Filtered Payments',
      value: dynamicTotal.toString(),
      change: 'Matching criteria',
      trend: 'up',
      icon: TrendingUp,
    },
  ];

  // Chart Data: Group by Year
  const chartDataMap: Record<string, number> = {};
  filteredPayments.filter(p => p.status === 'completed').forEach(p => {
    const year = new Date(p.created_at).getFullYear().toString();
    chartDataMap[year] = (chartDataMap[year] || 0) + Number(p.amount);
  });
  
  const chartData = Object.keys(chartDataMap)
    .sort()
    .map(year => ({
      year,
      revenue: chartDataMap[year]
    }));

  // Get top 5 most recent payments
  const recentPayments = [...filteredPayments]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map(p => ({
      id: p.id,
      student: p.student_name || (p.registration ? `${p.registration.first_name} ${p.registration.last_name}` : 'Unknown'),
      amount: `TSH ${Number(p.amount).toLocaleString()}`,
      type: p.fee_type?.replace(/_/g, ' '),
      status: p.status,
      date: new Date(p.created_at).toLocaleDateString()
    }));

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.name || 'Accountant'}</h1>
          <p className="text-muted-foreground">Here&apos;s what&apos;s happening with student finances today.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs mt-1">
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                  {stat.change}
                </span>
                <span className="text-muted-foreground ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Year</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `TSH ${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value) => `TSH ${Number(value).toLocaleString()}`} />
                  <Bar dataKey="revenue" fill="#0D7377" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                No revenue data available for the selected filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Payment ID</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((payment) => (
                  <tr key={payment.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{payment.id}</td>
                    <td className="py-3 px-4">{payment.student}</td>
                    <td className="py-3 px-4">{payment.type}</td>
                    <td className="py-3 px-4 font-medium">{payment.amount}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{payment.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/accountant/payments">
          <Card className="bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Revenue & Payments</h3>
                  <p className="text-sm text-muted-foreground">Monitor fees & structures</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Student Fee Lookup</h3>
                <p className="text-sm text-muted-foreground">Search student payment history</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Generate Reports</h3>
                <p className="text-sm text-muted-foreground">Monthly financial reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

