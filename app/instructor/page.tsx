'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { coursesApi } from '@/lib/api';
import { apiClient } from '@/lib/api-client';
import { useLMS } from '@/lib/lms-context';
import { useResults } from '@/lib/results-context';
import {
    BookOpen,
    FileText,
    PlusCircle,
    Star,
    TrendingUp,
    Users
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  program_id?: number | string;
  department?: {
    name: string;
  };
  credit?: {
    name: string;
    value: number;
  };
  instructor_assignments?: Array<{
    academic_year: string;
    semester: string;
  }>;
}

export default function InstructorDashboard() {
  const { currentUser } = useLMS();
  const { examResults } = useResults();
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentsCount, setStudentsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const pendingResults = examResults.filter(r => r.status === 'submitted').length;
  const approvedResults = examResults.filter(r => r.status === 'approved').length;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [coursesRes, registrations] = await Promise.all([
        coursesApi.getMyCourses().catch(() => ({ data: [] })),
        apiClient.getRegistrations().catch(() => [])
      ]);
      
      const fetchedCourses = coursesRes.data || [];
      setCourses(fetchedCourses);

      // Calculate real student count:
      // A student is considered in this instructor's courses if their program_id matches
      // the program_id of any course the instructor teaches.
      const instructorProgramIds = new Set(
        fetchedCourses
          .filter(c => c.program_id)
          .map(c => String(c.program_id))
      );
      
      const uniqueStudents = registrations.filter(reg => instructorProgramIds.has(String(reg.programId)));
      setStudentsCount(uniqueStudents.length);
      
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: 'Total Students',
      value: studentsCount.toString(),
      description: 'Active students',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: 'Total Results',
      value: examResults.length.toString(),
      description: `${approvedResults} approved`,
      icon: FileText,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: 'Pending Approval',
      value: pendingResults.toString(),
      description: 'Awaiting review',
      icon: TrendingUp,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
    {
      title: 'Average Grade',
      value: 'B+',
      description: 'Overall performance',
      icon: Star,
      color: 'text-rose-600',
      bg: 'bg-rose-100',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {currentUser?.name?.split(' ')[0] || 'Instructor'}!</h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your students and results
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* My Courses Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            My Assigned Courses
          </CardTitle>
          <CardDescription>
            Courses you are currently teaching ({courses.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {courses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-sm">{course.code}</h3>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {course.credit?.value || 0} Credits
                    </span>
                  </div>
                  <p className="text-sm font-medium mb-1">{course.name}</p>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {course.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {course.department?.name || 'N/A'}
                    </span>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/instructor/results?course_id=${course.id}`}>
                        Manage
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No courses assigned to you yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Results Management</CardTitle>
            <CardDescription>Upload and approve student exam results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-md">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Pending Approvals</p>
                  <p className="text-sm text-muted-foreground">{pendingResults} Results</p>
                </div>
              </div>
              <Button size="sm" asChild>
                <Link href="/instructor/results">Review All</Link>
              </Button>
            </div>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/instructor/results">
                <PlusCircle className="mr-2 h-4 w-4" />
                Enter New Results
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Students Records</CardTitle>
            <CardDescription>Manage student profiles and academic info</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/10 p-2 rounded-md">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Direct Students</p>
                  <p className="text-sm text-muted-foreground">{studentsCount} Enrolled</p>
                </div>
              </div>
              <Button size="sm" asChild variant="ghost">
                <Link href="/instructor/students">View List</Link>
              </Button>
            </div>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/instructor/students">
                <Users className="mr-2 h-4 w-4" />
                Manage All Students
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
