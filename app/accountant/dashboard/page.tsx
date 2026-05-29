'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
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

  // Mock data - will be replaced with API calls
  const stats = [
    {
      title: 'Total Payments Today',
      value: 'TSH 125,000',
      change: '+12%',
      trend: 'up',
      icon: CreditCard,
    },
    {
      title: 'Pending Verifications',
      value: '8',
      change: '-3',
      trend: 'down',
      icon: Receipt,
    },
    {
      title: 'Active Students',
      value: '1,248',
      change: '+24',
      trend: 'up',
      icon: Users,
    },
    {
      title: 'Monthly Revenue',
      value: 'TSH 2.4M',
      change: '+8%',
      trend: 'up',
      icon: TrendingUp,
    },
  ];

  const recentPayments = [
    { id: 'PAY-001', student: 'John Doe', amount: 'TSH 50,000', type: 'Tuition Fee', status: 'completed', date: '2024-04-29' },
    { id: 'PAY-002', student: 'Jane Smith', amount: 'TSH 25,000', type: 'Library Fee', status: 'pending', date: '2024-04-29' },
    { id: 'PAY-003', student: 'Mike Johnson', amount: 'TSH 75,000', type: 'Tuition Fee', status: 'completed', date: '2024-04-28' },
    { id: 'PAY-004', student: 'Sarah Williams', amount: 'TSH 5,000', type: 'Examination Fee', status: 'completed', date: '2024-04-28' },
    { id: 'PAY-005', student: 'David Brown', amount: 'TSH 30,000', type: 'Hostel Fee', status: 'pending', date: '2024-04-27' },
  ];

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

