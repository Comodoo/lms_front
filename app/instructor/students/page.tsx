'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLMS } from '@/lib/lms-context';
import { apiClient } from '@/lib/api-client';
import { coursesApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useResults } from '@/lib/results-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Users,
  TrendingUp,
  BookOpen,
  MoreVertical,
  Eye,
  UserMinus,
  CheckCircle,
  Clock,
  PauseCircle,
  Filter,
  Download,
  Mail,
  Plus,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { StudentEnrollmentInfo, EnrollmentStatus } from '@/lib/types';

const resultSchema = z.object({
  studentProfileId: z.string().min(1),
  registrationNumber: z.string().min(1),
  studentName: z.string().min(1),
  academicYear: z.string().min(1),
  semester: z.enum(['first', 'second', 'summer']),
  courseOfferingId: z.string().min(1),
  courseCode: z.string().min(1),
  courseName: z.string().min(1),
  credits: z.number().min(1),
  cat1Score: z.number().min(0).max(100).optional(),
  cat2Score: z.number().min(0).max(100).optional(),
  assignmentScore: z.number().min(0).max(100).optional(),
  finalExamScore: z.number().min(0).max(100),
  instructorId: z.string().min(1),
  instructorName: z.string().min(1),
});

type ResultFormValues = z.infer<typeof resultSchema>;

function getStatusIcon(status: EnrollmentStatus) {
  switch (status) {
    case 'active':
      return <Clock className="h-3.5 w-3.5 text-blue-500" />;
    case 'completed':
      return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
    case 'paused':
      return <PauseCircle className="h-3.5 w-3.5 text-amber-500" />;
  }
}

function getStatusColor(status: EnrollmentStatus) {
  switch (status) {
    case 'active':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'completed':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'paused':
      return 'bg-amber-50 text-amber-700 border-amber-200';
  }
}

function StudentDetailSheet({
  student,
  open,
  onClose,
  onRemove,
}: {
  student: StudentEnrollmentInfo | null;
  open: boolean;
  onClose: () => void;
  onRemove: (userId: string, courseId: string) => void;
}) {
  const [removeConfirm, setRemoveConfirm] = useState(false);

  if (!student) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                {student.userName.charAt(0)}
              </div>
              <div>
                <SheetTitle className="text-xl">{student.userName}</SheetTitle>
                <SheetDescription>{student.userEmail}</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-6">
            {/* Enrollment Info */}
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Enrollment Details
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Course</span>
                  <span className="font-medium text-right max-w-[200px] truncate">{student.courseTitle}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Enrolled</span>
                  <span className="font-medium">
                    {new Date(student.enrolledAt).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant="outline"
                    className={cn('flex items-center gap-1 text-xs', getStatusColor(student.status))}
                  >
                    {getStatusIcon(student.status)}
                    {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                  </Badge>
                </div>
                {student.lastActivity && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Active</span>
                    <span className="font-medium">
                      {new Date(student.lastActivity).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress */}
            <div className="rounded-lg border p-4 space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Learning Progress
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{student.progress}% Complete</span>
                  <span className="text-muted-foreground">
                    {student.completedLessons} / {student.totalLessons} lessons
                  </span>
                </div>
                <Progress value={student.progress} className="h-3" />
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="text-center p-3 rounded-lg bg-muted">
                  <div className="text-2xl font-bold text-primary">{student.completedLessons}</div>
                  <div className="text-xs text-muted-foreground mt-1">Completed</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <div className="text-2xl font-bold text-amber-600">
                    {student.totalLessons - student.completedLessons}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Remaining</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted">
                  <div className="text-2xl font-bold text-green-600">{student.progress}%</div>
                  <div className="text-xs text-muted-foreground mt-1">Progress</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  window.location.href = `mailto:${student.userEmail}`;
                }}
              >
                <Mail className="h-4 w-4" />
                Send Email
              </Button>
              <Button
                variant="destructive"
                className="w-full gap-2"
                onClick={() => setRemoveConfirm(true)}
              >
                <UserMinus className="h-4 w-4" />
                Remove from Course
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={removeConfirm} onOpenChange={setRemoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{student.userName}</strong> from{' '}
              <strong>{student.courseTitle}</strong>? This will delete their enrollment and progress data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onRemove(student.userId, student.courseId);
                setRemoveConfirm(false);
                onClose();
              }}
            >
              Remove Student
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const generateRegistrationNumber = (id: string | number) => {
  const paddedId = id.toString().padStart(4, '0');
  return `ZMS-26-01-${paddedId}`;
};

function StudentsContent() {
  const searchParams = useSearchParams();
  const initialCourseId = searchParams.get('course_id') || 'all';
  
  const { currentUser, removeStudentFromCourse } = useLMS();
  const { getCourseOfferings, getStudentProfiles, createExamResult, loading: resultsLoading } = useResults();
  
  const instructorId = currentUser?.id || '';

  const [realStudents, setRealStudents] = useState<StudentEnrollmentInfo[]>([]);
  const [realCourses, setRealCourses] = useState<any[]>([]);
  const [rawRegistrations, setRawRegistrations] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>(initialCourseId);
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | 'all'>('all');
  const [progressFilter, setProgressFilter] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentEnrollmentInfo | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkRemoveConfirm, setBulkRemoveConfirm] = useState(false);
  
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [courseOfferings, setCourseOfferings] = useState<any[]>([]);
  const [studentProfiles, setStudentProfiles] = useState<any[]>([]);

  const form = useForm<ResultFormValues>({
    resolver: zodResolver(resultSchema),
    defaultValues: {
      studentProfileId: '',
      registrationNumber: '',
      studentName: '',
      academicYear: '2025/2026',
      semester: 'first',
      courseOfferingId: '',
      courseCode: '',
      courseName: '',
      credits: 3,
      cat1Score: 0,
      cat2Score: 0,
      assignmentScore: 0,
      finalExamScore: 0,
      instructorId: currentUser?.id || 'instructor-1',
      instructorName: currentUser?.name || 'Dr. John Doe',
    },
  });

  // Load results info
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const [registrations, coursesRes, offerings, profiles] = await Promise.all([
          apiClient.getRegistrations().catch(() => []),
          coursesApi.getAll().catch(() => ({ data: [] })),
          getCourseOfferings(),
          getStudentProfiles()
        ]);

        const allCourses = Array.isArray(coursesRes.data) ? coursesRes.data : [];
        setRealCourses(allCourses);

        const mappedStudents: StudentEnrollmentInfo[] = [];
        
        registrations.forEach((reg: any) => {
          // Find courses that match this student's program
          const programCourses = allCourses.filter(c => String(c.program_id) === String(reg.programId));
          
          programCourses.forEach(course => {
            mappedStudents.push({
              userId: reg.id.toString(),
              userName: `${reg.firstName} ${reg.lastName}`,
              userEmail: reg.email || reg.guardianEmail || 'no-email@example.com',
              courseId: course.id.toString(),
              courseTitle: course.name || course.code,
              enrolledAt: new Date(reg.approvedAt || reg.submittedAt || new Date()),
              progress: 0,
              status: 'active',
              completedLessons: 0,
              totalLessons: 10, // Placeholder
              lastActivity: new Date(),
            });
          });
        });

        setRealStudents(mappedStudents);
        setRawRegistrations(registrations);
        setCourseOfferings(offerings);
        setStudentProfiles(profiles);
      } catch (error) {
        console.error('Failed to load student data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmitResult = async (data: ResultFormValues) => {
    await createExamResult(data);
    setDialogOpen(false);
    form.reset();
  };

  const handleBulkUpload = async () => {
    setIsUploading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsUploading(false);
    setUploadDialogOpen(false);
  };

  const handleCourseChange = (courseId: string) => {
    const course = realCourses.find(c => c.id.toString() === courseId);
    if (course) {
      form.setValue('courseCode', course.code || '');
      form.setValue('courseName', course.name || '');
      form.setValue('credits', Number(course.credit?.value || course.credits || 3));
      // Reset student selection when course changes
      form.setValue('studentProfileId', '');
      form.setValue('registrationNumber', '');
      form.setValue('studentName', '');
    }
  };

  const handleStudentChange = (studentUserId: string) => {
    const student = rawRegistrations.find(s => (s.user_id ? s.user_id.toString() : s.id.toString()) === studentUserId);
    if (student) {
      form.setValue('registrationNumber', student.registrationNumber || generateRegistrationNumber(student.id));
      form.setValue('studentName', `${student.firstName} ${student.lastName}`);
      form.setValue('academicYear', student.currentAcademicYear || '2025/2026');
      form.setValue('semester', student.currentSemester || 'first');
      
      const courseId = form.getValues('courseOfferingId');
      const course = realCourses.find(c => c.id.toString() === courseId);
      if (course) {
        form.setValue('credits', Number(course.credit?.value || course.credits || 3));
      }
    }
  };

  const selectedCourseId = form.watch('courseOfferingId');
  const availableStudents = useMemo(() => {
    if (!selectedCourseId) return [];
    const course = realCourses.find(c => c.id.toString() === selectedCourseId);
    if (!course) return [];
    return rawRegistrations.filter(reg => String(reg.programId) === String(course.program_id));
  }, [selectedCourseId, realCourses, rawRegistrations]);

  const filtered = useMemo(() => {
    return realStudents.filter((s) => {
      const matchesSearch =
        s.userName.toLowerCase().includes(search.toLowerCase()) ||
        s.userEmail.toLowerCase().includes(search.toLowerCase()) ||
        s.courseTitle.toLowerCase().includes(search.toLowerCase());
      const matchesCourse = courseFilter === 'all' || s.courseId === courseFilter;
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchesProgress =
        progressFilter === 'all' ||
        (progressFilter === 'not_started' && s.progress === 0) ||
        (progressFilter === 'in_progress' && s.progress > 0 && s.progress < 100) ||
        (progressFilter === 'completed' && s.progress === 100);
      return matchesSearch && matchesCourse && matchesStatus && matchesProgress;
    });
  }, [realStudents, search, courseFilter, statusFilter, progressFilter]);

  const stats = useMemo(() => {
    const unique = new Set(realStudents.map((s) => s.userId));
    const active = realStudents.filter((s) => s.status === 'active').length;
    const completed = realStudents.filter((s) => s.status === 'completed').length;
    const avgProgress =
      realStudents.length > 0
        ? Math.round(realStudents.reduce((acc, s) => acc + s.progress, 0) / realStudents.length)
        : 0;
    return { total: unique.size, active, completed, avgProgress };
  }, [realStudents]);

  const toggleBulkSelect = (key: string) => {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (bulkSelected.size === filtered.length) {
      setBulkSelected(new Set());
    } else {
      setBulkSelected(new Set(filtered.map((s) => `${s.userId}-${s.courseId}`)));
    }
  };

  const handleBulkRemove = () => {
    bulkSelected.forEach((key) => {
      const [userId, courseId] = key.split('-');
      removeStudentFromCourse(userId, courseId);
    });
    setBulkSelected(new Set());
    setBulkRemoveConfirm(false);
  };

  const exportCsv = () => {
    const rows = [
      ['Name', 'Email', 'Course', 'Progress', 'Status', 'Enrolled At', 'Completed Lessons'],
      ...filtered.map((s) => [
        s.userName,
        s.userEmail,
        s.courseTitle,
        `${s.progress}%`,
        s.status,
        new Date(s.enrolledAt).toLocaleDateString(),
        `${s.completedLessons}/${s.totalLessons}`,
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Student Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all enrolled students across your courses
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start">
          <Button variant="outline" onClick={exportCsv} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => setUploadDialogOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Bulk Upload
          </Button>
          <Button onClick={() => { form.reset(); setDialogOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Result
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Students',
            value: stats.total,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Active Learners',
            value: stats.active,
            icon: TrendingUp,
            color: 'text-green-600',
            bg: 'bg-green-50',
          },
          {
            label: 'Completed',
            value: stats.completed,
            icon: CheckCircle,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Avg Progress',
            value: `${stats.avgProgress}%`,
            icon: BookOpen,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={cn('p-2.5 rounded-lg', stat.bg)}>
                <stat.icon className={cn('h-5 w-5', stat.color)} />
              </div>
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or course..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {realCourses.map((c) => {
                    const title = c.name || c.code || '';
                    return (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {title.length > 28 ? title.slice(0, 28) + '...' : title}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as EnrollmentStatus | 'all')}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>

              <Select value={progressFilter} onValueChange={setProgressFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Progress" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Progress</SelectItem>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">100% Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {bulkSelected.size > 0 && (
            <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-muted border">
              <span className="text-sm font-medium">{bulkSelected.size} selected</span>
              <Button
                size="sm"
                variant="destructive"
                className="gap-2"
                onClick={() => setBulkRemoveConfirm(true)}
              >
                <UserMinus className="h-4 w-4" />
                Remove Selected
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setBulkSelected(new Set())}>
                Clear
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {filtered.length} student{filtered.length !== 1 ? 's' : ''}
            {search || courseFilter !== 'all' || statusFilter !== 'all' || progressFilter !== 'all'
              ? ' (filtered)'
              : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <Users className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No students found</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                {realStudents.length === 0
                  ? 'No students have enrolled in your courses yet.'
                  : 'Try adjusting your search or filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={bulkSelected.size === filtered.length && filtered.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-input"
                      />
                    </TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((student) => {
                    const key = `${student.userId}-${student.courseId}`;
                    return (
                      <TableRow key={key} className="hover:bg-muted/50">
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={bulkSelected.has(key)}
                            onChange={() => toggleBulkSelect(key)}
                            className="rounded border-input"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-sm font-semibold text-primary">
                                {student.userName.charAt(0)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">{student.userName}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {student.userEmail}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm line-clamp-1 max-w-[180px]">
                            {student.courseTitle}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1.5 min-w-[120px]">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium">{student.progress}%</span>
                              <span className="text-muted-foreground">
                                {student.completedLessons}/{student.totalLessons}
                              </span>
                            </div>
                            <Progress value={student.progress} className="h-1.5" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              'flex items-center gap-1 w-fit text-xs',
                              getStatusColor(student.status)
                            )}
                          >
                            {getStatusIcon(student.status)}
                            {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(student.enrolledAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setSheetOpen(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  window.location.href = `mailto:${student.userEmail}`;
                                }}
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setSheetOpen(true);
                                }}
                              >
                                <UserMinus className="mr-2 h-4 w-4" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Detail Sheet */}
      <StudentDetailSheet
        student={selectedStudent}
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setSelectedStudent(null);
        }}
        onRemove={(userId, courseId) => {
          removeStudentFromCourse(userId, courseId);
        }}
      />

      {/* Bulk Remove Dialog */}
      <AlertDialog open={bulkRemoveConfirm} onOpenChange={setBulkRemoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {bulkSelected.size} Students</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the selected {bulkSelected.size} student enrollment
              {bulkSelected.size !== 1 ? 's' : ''} and all associated progress data. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleBulkRemove}
            >
              Remove All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Result Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-full max-w-[80vw] h-[85vh] overflow-y-auto p-10">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl">Add New Result</DialogTitle>
            <DialogDescription className="text-lg mt-2">
              Enter exam result details for a student
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitResult)} className="space-y-6">
              <FormField
                control={form.control}
                name="courseOfferingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select onValueChange={(value) => { field.onChange(value); handleCourseChange(value); }} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select course first" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {realCourses.map((course) => (
                          <SelectItem key={course.id.toString()} value={course.id.toString()}>
                            {course.code} - {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="studentProfileId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select 
                        onValueChange={(value) => { field.onChange(value); handleStudentChange(value); }} 
                        value={field.value || undefined}
                        disabled={!selectedCourseId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={selectedCourseId ? "Select student" : "Select a course first"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableStudents.map((student) => (
                            <SelectItem key={student.id.toString()} value={student.user_id ? student.user_id.toString() : student.id.toString()}>
                              {student.firstName} {student.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="registrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Number</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="academicYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "2025/2026"} disabled>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="2025/2026">2025/2026</SelectItem>
                          <SelectItem value="2024/2025">2024/2025</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semester</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "first"} disabled>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="first">Semester One</SelectItem>
                          <SelectItem value="second">Semester Two</SelectItem>
                          <SelectItem value="summer">Summer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="credits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credits</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-4 gap-6">
                <FormField
                  control={form.control}
                  name="cat1Score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CAT 1 (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" {...field} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cat2Score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CAT 2 (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" {...field} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assignmentScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignment (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" {...field} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="finalExamScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Final Exam *</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={resultsLoading}>
                  Add Result
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Results Upload</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file containing student results.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed rounded-lg p-10 text-center flex flex-col items-center justify-center bg-muted/30">
              <Upload className="w-10 h-10 mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">CSV, XLSX or XLS (max. 10MB)</p>
              <Input type="file" className="hidden" id="bulk-upload" accept=".csv,.xlsx,.xls" />
              <Button variant="outline" size="sm" className="mt-4" onClick={() => document.getElementById('bulk-upload')?.click()}>
                Select File
              </Button>
            </div>
            <div className="bg-blue-50 border border-blue-100 p-3 rounded-md text-xs text-blue-700">
               <p className="font-bold mb-1">Template Instructions:</p>
               <ul className="list-disc list-inside space-y-1">
                 <li>Column A: Student Registration Number</li>
                 <li>Column B: Course Code</li>
                 <li>Column C: Score (0-100)</li>
               </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkUpload} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Start Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <StudentsContent />
    </Suspense>
  );
}
