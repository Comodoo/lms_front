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
} from 'lucide-react';

export default function AccountantDashboardPage() {
  const { user } = useAuth();

  const [payments, setPayments] = useState<any[]>([]);
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [paymentsRes, statsRes] = await Promise.all([
          paymentsApi.getAll(),
          dashboardApi.getAccountantStats()
        ]);
        
        if (paymentsRes.data) setPayments(paymentsRes.data as any[]);
        if (statsRes.data) setStatsData(statsRes.data);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const totalPaymentsToday = statsData?.totalPaymentsToday || 0;
  const pendingVerifications = statsData?.pendingVerifications || 0;
  const activeStudents = statsData?.activeStudents || 0;
  const monthlyRevenue = statsData?.monthlyRevenue || 0;

  const stats = [
    {
      title: 'Total Payments Today',
      value: `TSH ${totalPaymentsToday.toLocaleString()}`,
      change: 'Today',
      trend: totalPaymentsToday > 0 ? 'up' : 'down',
      icon: CreditCard,
    },
    {
      title: 'Pending Verifications',
      value: pendingVerifications.toString(),
      change: 'Action Required',
      trend: pendingVerifications > 0 ? 'up' : 'down',
      icon: Receipt,
    },
    {
      title: 'Active Students',
      value: activeStudents.toString(),
      change: 'Total Registered',
      trend: 'up',
      icon: Users,
    },
    {
      title: 'Monthly Revenue',
      value: `TSH ${monthlyRevenue.toLocaleString()}`,
      change: 'This Month',
      trend: monthlyRevenue > 0 ? 'up' : 'down',
      icon: TrendingUp,
    },
  ];

  // Get top 5 most recent payments
  const recentPayments = [...payments]
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
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Verify Cash Payments</h3>
                <p className="text-sm text-muted-foreground">8 pending verifications</p>
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

