'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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

import { RegistrationPayment } from '@/lib/college-types';
import { apiClient } from '@/lib/api-client';
import { coursesApi } from '@/lib/api';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { registrations, loading } = useRegistration();
  const [activeTab, setActiveTab] = useState('info');
  const [payments, setPayments] = useState<RegistrationPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [examResults, setExamResults] = useState<any[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [programCoursesCount, setProgramCoursesCount] = useState(0);

  const hasRegistration = registrations.length > 0;
  const currentRegistration = registrations[0];

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (currentRegistration?.id) {
        setPaymentsLoading(true);
        setResultsLoading(true);
        try {
          const [paymentsData, resultsData, coursesRes] = await Promise.all([
            apiClient.getPaymentsByRegistration(currentRegistration.id).catch(() => []),
            apiClient.getStudentResults().catch((err) => { console.error("Student Results Error", err); return []; }),
            coursesApi.getAll().catch(() => ({ data: [] }))
          ]);
          console.log("PAYMENTS DATA:", paymentsData?.length);
          console.log("RESULTS DATA:", JSON.stringify(resultsData).substring(0, 300));
          setPayments(paymentsData || []);
          // Results data might be an array or an object depending on API structure
          setExamResults(Array.isArray(resultsData) ? resultsData : ((resultsData as any)?.data || []));
          
          // Filter courses by the student's program
          const allCourses = coursesRes?.data || [];
          if (Array.isArray(allCourses)) {
            const registeredCourses = allCourses.filter((c: any) => 
              String(c.program_id) === String(currentRegistration.programId)
            );
            setProgramCoursesCount(registeredCourses.length);
          }
        } finally {
          setPaymentsLoading(false);
          setResultsLoading(false);
        }
      }
    };
    fetchDashboardData();
  }, [currentRegistration?.id]);

  // Generate dynamic academic year and semester
  const regDate = currentRegistration?.approvedAt || currentRegistration?.submittedAt || new Date().toISOString();
  const startYear = new Date(regDate).getFullYear();
  let academicYear = `${startYear}/${startYear + 1}`;
  let registeredSemester = 1;

  const hasSemester1Payment = payments.some((p: any) => p.status === 'completed' && (p.description?.toLowerCase().includes('semester 1') || p.feeType?.toLowerCase().includes('semester_1') || p.feeType === 'tuition' || p.feeType === 'tuition_fee'));
  const hasSemester2Payment = payments.some((p: any) => p.status === 'completed' && (p.description?.toLowerCase().includes('semester 2') || p.feeType?.toLowerCase().includes('semester_2')));

  if (examResults && examResults.length > 0) {
    // If we have exam results (which act as registered courses), use their academic year and semester
    if (examResults[0].academic_year || examResults[0].academicYear) {
      academicYear = examResults[0].academic_year || examResults[0].academicYear;
    }
    if (examResults[0].semester) {
      const sem = String(examResults[0].semester).toLowerCase();
      registeredSemester = sem === 'second' || sem === '2' ? 2 : (sem === 'summer' || sem === '3' ? 3 : 1);
    }
  } else {
    // Fallback to payments if no results
    registeredSemester = hasSemester2Payment ? 2 : (hasSemester1Payment ? 1 : 1);
  }

  // Calculate GPA and course stats
  let totalCourses = programCoursesCount || examResults.length;
  let coursesCompleted = 0;
  let totalGradePoints = 0;

  examResults.forEach((result: any) => {
    const score = Number(result.final_exam_score || result.total_score || result.finalExamScore || result.totalScore || 0);
    if (score >= 40) coursesCompleted++; // Pass mark
    
    // Standard GPA mapping
    if (score >= 80) totalGradePoints += 5;
    else if (score >= 70) totalGradePoints += 4;
    else if (score >= 60) totalGradePoints += 3;
    else if (score >= 50) totalGradePoints += 2;
    else if (score >= 40) totalGradePoints += 1;
  });

  const gpa = totalCourses > 0 ? (totalGradePoints / totalCourses) : 0.0;

  // Generate dynamic real data for semesters based on payments and exam results
  const generatedSemesterData: any[] = [];
  
  const paidSemesters = new Set<string>();
  payments.forEach((p: any) => {
    if (p.status === 'completed') {
      const desc = p.description?.toLowerCase() || '';
      const fType = p.feeType?.toLowerCase() || '';
      if (desc.includes('semester 1') || fType.includes('semester_1') || fType === 'tuition' || fType === 'tuition_fee') paidSemesters.add('1');
      if (desc.includes('semester 2') || fType.includes('semester_2')) paidSemesters.add('2');
      if (desc.includes('summer') || desc.includes('semester 3') || fType.includes('semester_3')) paidSemesters.add('3');
    }
  });

  const resultSemesters = new Set<string>();
  examResults.forEach((r: any) => {
    const sem = String(r.semester || '').toLowerCase();
    if (sem === 'first' || sem === '1') resultSemesters.add('1');
    if (sem === 'second' || sem === '2') resultSemesters.add('2');
    if (sem === 'summer' || sem === '3') resultSemesters.add('3');
  });

  const allKnownSemesters = Array.from(new Set([...Array.from(paidSemesters), ...Array.from(resultSemesters)])).map(Number).sort();

  if (allKnownSemesters.length === 0) {
    // Base case: Show pending first semester
    generatedSemesterData.push({
      id: 1,
      name: 'SEMESTER ONE',
      period: `Academic Year ${academicYear}`,
      status: currentRegistration?.status === 'approved' ? 'Awaiting Payment' : 'Registration Pending',
      paid: false,
    });
  } else {
    // Generate rows for all real semesters
    allKnownSemesters.forEach((semNum) => {
      const isPaid = paidSemesters.has(String(semNum));
      generatedSemesterData.push({
        id: semNum,
        name: `SEMESTER ${semNum === 1 ? 'ONE' : semNum === 2 ? 'TWO' : semNum === 3 ? 'SUMMER' : semNum}`,
        period: `Academic Year ${academicYear}`,
        status: isPaid ? 'Paid & Registered' : 'Registered / Awaiting Payment',
        paid: isPaid,
      });
    });
  }

  const semesterData = generatedSemesterData;

  const studentData = {
    studentId: currentRegistration?.registrationNumber || 'Pending...',
    fullName: currentRegistration ? `${currentRegistration.firstName} ${currentRegistration.lastName}` : (user?.name || 'Student'),
    program: currentRegistration?.programName || 'Not Assigned',
    college: 'Main Campus',
    phone: currentRegistration?.phone || (user as any)?.phone || 'N/A',
    academicYear: academicYear,
    yearOfStudy: '1st Year',
    gpa: gpa,
    cgpa: gpa, // CGPA matches GPA for first year
    coursesRegistered: totalCourses,
    registeredSemester: registeredSemester,
    coursesCompleted: coursesCompleted,
    totalCourses: totalCourses,
  };

  if (!loading && !hasRegistration) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
          <Monitor className="w-12 h-12 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Welcome to Zanzibar Metropolitan College (ZMC)!</h2>
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
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${semester.paid ? 'bg-green-50 text-green-600' : (semester.status === 'Registration Pending' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600')}`}>
                            {semester.paid ? <CheckCircle2 className="h-3 w-3" /> : (semester.status === 'Registration Pending' ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />)}
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
                  <Accordion type="single" collapsible className="space-y-4">
                    {payments.map((payment, idx) => (
                      <AccordionItem key={payment.id} value={`payment-${payment.id}`} className="border rounded-lg bg-white shadow-sm overflow-hidden">
                        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex flex-col items-start gap-1">
                              <span className="text-sm font-semibold">{payment.description || payment.feeType}</span>
                              <span className="text-xs text-muted-foreground">#{payments.length - idx}</span>
                            </div>
                            <Badge className={payment.status === 'completed' ? "bg-green-600 text-white" : "bg-orange-600 text-white"}>
                              {payment.status === 'completed' ? 'PAID' : 'PENDING'}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pt-2 border-t">
                          <div className="space-y-3 mt-2">
                            <div className="flex justify-between py-1">
                              <span className="text-sm font-medium">Control Number:</span>
                              <span className="text-sm font-bold tracking-wider">{payment.controlNumber}</span>
                            </div>
                            <div className="flex justify-between py-1 border-t pt-2 mt-2">
                              <span className="text-sm text-muted-foreground">Billed Amount:</span>
                              <span className="text-sm font-medium">{Number(payment.amount).toLocaleString()} TSH</span>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
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


        </div>
      </div>
    </div>
  );
}
