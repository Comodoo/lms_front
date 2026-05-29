'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth-context';
import { useRegistration } from '@/lib/registration-context';
import Link from 'next/link';
import {
    CheckCircle2,
    Clock,
    Computer,
    LayoutGrid,
    Monitor,
    XCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';

// We will derive studentData dynamically in the component instead of mock data

const semesterData = [
  {
    id: 1,
    name: 'SEMESTER ONE',
    period: 'Apr 22, 2026 - Apr 22, 2026',
    status: 'Registration Period Passed',
    active: false,
  },
  {
    id: 2,
    name: 'SEMESTER TWO',
    period: 'Apr 23, 2026 - Apr 24, 2026',
    status: 'Registration Period Passed',
    active: false,
  },
];

import { RegistrationPayment } from '@/lib/college-types';
import { apiClient } from '@/lib/api-client';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { registrations, loading } = useRegistration();
  const [activeTab, setActiveTab] = useState('info');
  const [payments, setPayments] = useState<RegistrationPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  const hasRegistration = registrations.length > 0;
  const currentRegistration = registrations[0];

  useEffect(() => {
    const fetchPayments = async () => {
      if (currentRegistration?.id) {
        setPaymentsLoading(true);
        try {
          const data = await apiClient.getPaymentsByRegistration(currentRegistration.id);
          setPayments(data);
        } catch (error) {
          console.error("Failed to fetch payments", error);
        } finally {
          setPaymentsLoading(false);
        }
      }
    };
    fetchPayments();
  }, [currentRegistration?.id]);

  const studentData = {
    studentId: currentRegistration?.registrationNumber || 'Pending...',
    fullName: currentRegistration ? `${currentRegistration.firstName} ${currentRegistration.lastName}` : (user?.name || 'Student'),
    program: currentRegistration?.programName || 'Not Assigned',
    college: 'Main Campus',
    phone: currentRegistration?.phone || user?.phone || 'N/A',
    academicYear: '2025/2026',
    yearOfStudy: '1st Year of Study',
    gpa: 0.0,
    cgpa: 0.0,
    coursesRegistered: 0,
    registeredSemester: 0,
    coursesCompleted: 0,
    totalCourses: 0,
  };

  if (!loading && !hasRegistration) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
          <Monitor className="w-12 h-12 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Welcome to College LMS!</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            It looks like you haven't applied for a program yet. Please complete your academic registration to continue.
          </p>
        </div>
        <Link href="/registration">
          <Button size="lg" className="px-8">
            Start Registration
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Courses Registered */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-50">
              <Monitor className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Courses Registered</p>
              <p className="text-2xl font-bold">{studentData.coursesRegistered}</p>
            </div>
          </CardContent>
        </Card>

        {/* Registered Semester */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-cyan-50">
              <LayoutGrid className="h-6 w-6 text-cyan-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Registered Semester</p>
              <p className="text-2xl font-bold">{studentData.registeredSemester}</p>
            </div>
          </CardContent>
        </Card>

        {/* Course Completed */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-orange-50">
              <CheckCircle2 className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Course Completed</p>
              <p className="text-2xl font-bold">{studentData.coursesCompleted}/{studentData.totalCourses}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Online Registration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Online Registration Card */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Registration Status</CardTitle>
                <Badge variant="outline" className={`text-xs ${currentRegistration?.status === 'approved' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                  {currentRegistration?.status ? currentRegistration.status.toUpperCase() : 'PENDING'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Semester</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semesterData.map((semester, idx) => (
                      <tr key={semester.id} className={idx !== semesterData.length - 1 ? 'border-b' : ''}>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                              <span className="text-xs font-bold text-orange-600">{semester.id}</span>
                            </div>
                            <div>
                              <p className="font-medium text-sm">{semester.name}</p>
                              <p className="text-xs text-muted-foreground">{semester.period}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-600 text-xs">
                            <XCircle className="h-3 w-3" />
                            <span>{semester.status}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Button variant="outline" size="sm" disabled className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            No Actions
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* My Information / Payment Details / Loan Details Tabs */}
          <Card className="border-0 shadow-sm">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                <TabsTrigger
                  value="info"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                  My Information
                </TabsTrigger>
                <TabsTrigger
                  value="payment"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                  Payment Details
                </TabsTrigger>
                <TabsTrigger
                  value="loan"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                  Loan Details
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="p-6 pt-4 m-0">
                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span className="text-sm text-muted-foreground">Full Name:</span>
                    <span className="text-sm font-medium">{studentData.fullName}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span className="text-sm text-muted-foreground">Program:</span>
                    <span className="text-sm font-medium text-right max-w-xs">{studentData.program}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span className="text-sm text-muted-foreground">College:</span>
                    <span className="text-sm font-medium text-right max-w-xs">{studentData.college}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-dashed">
                    <span className="text-sm text-muted-foreground">Phone:</span>
                    <span className="text-sm font-medium">{studentData.phone}</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="payment" className="p-6 pt-4 m-0">
                {paymentsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Loading bills...</p>
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No bills generated yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {payments.map((payment, idx) => (
                      <div key={payment.id} className="border rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-4 border-b pb-3">
                          <div className="text-sm text-muted-foreground">#{payments.length - idx}</div>
                          <Badge className={payment.status === 'completed' ? "bg-green-600 text-white" : "bg-orange-600 text-white"}>
                            {payment.status === 'completed' ? 'PAID' : 'PENDING'}
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between py-1">
                            <span className="text-sm font-medium">Description:</span>
                            <span className="text-sm">{payment.description || payment.feeType}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-sm font-medium">Control Number:</span>
                            <span className="text-sm font-bold tracking-wider">{payment.controlNumber}</span>
                          </div>
                          <div className="flex justify-between py-1 border-t pt-2 mt-2">
                            <span className="text-sm text-muted-foreground">Billed Amount:</span>
                            <span className="text-sm font-medium">{Number(payment.amount).toLocaleString()} TSH</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="loan" className="p-6 pt-4 m-0">
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No loan details available.</p>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Column - Academic Info & Quick Actions */}
        <div className="space-y-6">
          {/* Academic Year Card */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Academic Year</p>
                  <p className="text-sm font-medium">{studentData.academicYear}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-lg font-bold">{studentData.yearOfStudy}</p>
                  <Badge variant="secondary" className="mt-1 text-xs bg-green-100 text-green-700 hover:bg-green-100">
                    Graduated Student
                  </Badge>
                </div>

                {/* GPA Circle */}
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="8"
                      strokeDasharray={`${(studentData.gpa / 5) * 251} 251`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold">{studentData.gpa.toFixed(1)}</span>
                    <span className="text-[10px] text-muted-foreground">Overall GPA</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                {/* Quick actions content can be added here */}
              </div>
            </CardContent>
          </Card>

          {/* Permission Requests */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-50 flex items-center justify-center">
                <Computer className="h-6 w-6 text-blue-500" />
              </div>
              <h4 className="font-medium text-sm mb-1">No Permission Requests</h4>
              <p className="text-xs text-muted-foreground">You don't have any permission requests at the moment.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
