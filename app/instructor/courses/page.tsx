'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { coursesApi } from '@/lib/api';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Clock, 
  ChevronRight,
  FileText,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
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

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMyCourses();
  }, []);

  const loadMyCourses = async () => {
    setLoading(true);
    try {
      const response = await coursesApi.getMyCourses();
      if (response.error) {
        setError(response.error);
      } else {
        setCourses(response.data || []);
      }
    } catch (err) {
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
        <p className="text-muted-foreground">
          View and manage results for courses you are currently teaching.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {courses.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="group hover:shadow-lg transition-all duration-300 border-primary/10 hover:border-primary/30">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold bg-primary/5">
                      {course.code}
                    </Badge>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {course.name}
                    </CardTitle>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <BookOpen className="h-5 w-5" />
                  </div>
                </div>
                <CardDescription className="line-clamp-2 min-h-[40px]">
                  {course.description || 'No description provided.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{course.department?.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{course.credit?.value || 0} Credits</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{course.instructor_assignments?.[0]?.academic_year || '2025/2026'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px] h-5">
                      {course.instructor_assignments?.[0]?.semester.replace('_', ' ') || 'Semester 1'}
                    </Badge>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <Button asChild className="flex-1 text-xs h-9">
                    <Link href={`/instructor/results?course_id=${course.id}`}>
                      <FileText className="mr-2 h-4 w-4" />
                      Manage Results
                    </Link>
                  </Button>
                  <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                    <Link href={`/instructor/students?course_id=${course.id}`}>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed py-12">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">No Courses Assigned</h3>
              <p className="text-muted-foreground max-w-sm">
                You don't have any courses assigned to you at the moment. Please contact the administrator if this is an error.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
