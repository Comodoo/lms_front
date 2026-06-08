'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { paymentsApi, registrationsApi, programsApi } from '@/lib/api';
import {
  CreditCard,
  TrendingUp,
  Users,
  Receipt,
  DollarSign,
  ClipboardList,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AccountantDashboardPage() {
  const { user } = useAuth();

  const [payments, setPayments] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionFilter, setTransactionFilter] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [paymentsRes, registrationsRes, programsRes] = await Promise.all([
          paymentsApi.getAll(),
          registrationsApi.getAll(),
          programsApi.getAll()
        ]);
        
        if (paymentsRes.data) setPayments(paymentsRes.data as any[]);
        if (registrationsRes.data) setRegistrations(registrationsRes.data as any[]);
        if (programsRes.data) setPrograms(programsRes.data as any[]);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Compute stats from real data
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  let totalPayments = 0;
  let pendingRevenueToday = 0;
  let pendingVerifications = 0;

  payments.forEach(p => {
    // Strictly use created_at to perfectly match the Recent Transactions table logic
    const paymentDate = new Date(p.created_at);
    const isToday = new Date().toDateString() === paymentDate.toDateString();
    
    if (p.status === 'completed') {
      // Add all completed payments to the total
      totalPayments += Number(p.amount);
    } else if (p.status === 'pending' || p.status === 'verifying') {
      pendingVerifications++;
      if (isToday) {
        pendingRevenueToday += Number(p.amount);
      }
    }
  });

  // Count active students (using registrations)
  const activeStudents = registrations.length;

  // Calculate outstanding fees
  let totalExpectedRevenue = 0;
  registrations.forEach(r => {
    if (r.status === 'approved') {
      const program = programs.find(p => p.id === r.program_id);
      if (program && program.tuition_fee) {
        totalExpectedRevenue += Number(program.tuition_fee);
      }
    }
  });
  const outstandingFees = Math.max(0, totalExpectedRevenue - totalPayments);

  const stats = [
    {
      title: 'Total Payments (All Time)',
      value: `TSH ${totalPayments.toLocaleString()}`,
      change: 'All Time',
      trend: totalPayments > 0 ? 'up' : 'down',
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-100',
      subtext: pendingRevenueToday > 0 ? `+ TSH ${pendingRevenueToday.toLocaleString()} pending today` : undefined,
      period: ''
    },
    {
      title: 'Pending Verifications',
      value: pendingVerifications.toString(),
      change: 'Action Required',
      trend: pendingVerifications > 0 ? 'up' : 'down',
      icon: ClipboardList,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
      period: 'currently'
    },
    {
      title: 'Active Students',
      value: activeStudents.toString(),
      change: 'Total Registered',
      trend: 'up',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      period: 'all time'
    },
    {
      title: 'Outstanding Fees',
      value: `TSH ${outstandingFees.toLocaleString()}`,
      change: 'Unpaid Balances',
      trend: outstandingFees > 0 ? 'down' : 'up',
      icon: DollarSign,
      color: 'text-rose-600',
      bg: 'bg-rose-100',
      period: 'currently'
    },
  ];

  // Get filtered and sorted payments
  const recentPayments = [...payments]
    .filter(p => transactionFilter === 'all' ? true : p.status === transactionFilter)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)
    .map(p => {
      const dateObj = new Date(p.created_at);
      const isToday = new Date().toDateString() === dateObj.toDateString();
      const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateString = isToday ? `Today at ${timeString}` : `${dateObj.toLocaleDateString()} at ${timeString}`;

      return {
        id: p.id,
        student: p.student_name || (p.registration ? `${p.registration.first_name} ${p.registration.last_name}` : 'Unknown'),
        amount: `TSH ${Number(p.amount).toLocaleString()}`,
        type: p.fee_type?.replace(/_/g, ' '),
        status: p.status,
        date: dateString
      };
    });

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.name || 'Accountant'}</h1>
          <p className="text-muted-foreground">Here&apos;s what&apos;s happening with student finances today.</p>
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
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.subtext && (
                <div className="text-xs font-medium text-amber-600 mt-1 mb-1">
                  {stat.subtext}
                </div>
              )}
              <div className="flex items-center text-xs mt-1">
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                  {stat.change}
                </span>
                {stat.period && (
                  <span className="text-muted-foreground ml-1">{stat.period}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Recent Transactions (All Statuses)</CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground mr-1" />
            <Badge 
              variant={transactionFilter === 'all' ? 'default' : 'outline'} 
              className="cursor-pointer"
              onClick={() => setTransactionFilter('all')}
            >
              All
            </Badge>
            <Badge 
              variant={transactionFilter === 'completed' ? 'default' : 'outline'} 
              className="cursor-pointer bg-green-100 text-green-800 hover:bg-green-200 border-none"
              onClick={() => setTransactionFilter('completed')}
            >
              Completed
            </Badge>
            <Badge 
              variant={transactionFilter === 'pending' ? 'default' : 'outline'} 
              className="cursor-pointer bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-none"
              onClick={() => setTransactionFilter('pending')}
            >
              Pending
            </Badge>
          </div>
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
                            : payment.status === 'failed' || payment.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
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
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Verify Cash Payments</h3>
                <p className="text-sm text-muted-foreground">{pendingVerifications} pending verifications</p>
              </div>
            </div>
          </CardContent>
        </Card>

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

