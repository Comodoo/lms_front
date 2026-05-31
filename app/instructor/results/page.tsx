'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useResults } from '@/lib/results-context';
import { Plus, Eye, Edit, Trash2, CheckCircle2, XCircle, Search, Filter, Upload } from 'lucide-react';
import type { ExamResult } from '@/lib/college-types';

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

export default function InstructorResultsPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { examResults, courseOfferings, studentProfiles, createExamResult, updateExamResult, deleteExamResult, submitExamResult, calculateGrade, loading } = useResults();

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const [filteredResults, setFilteredResults] = useState<ExamResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
      instructorId: 'instructor-1',
      instructorName: 'Dr. John Doe',
    },
  });

  useEffect(() => {
    let filtered = examResults || [];

    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.courseCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (courseFilter !== 'all') {
      filtered = filtered.filter((r) => r.courseOfferingId === courseFilter);
    }

    setFilteredResults(filtered);
  }, [examResults, searchTerm, statusFilter, courseFilter]);

  const onSubmit = async (data: ResultFormValues) => {
    if (isEditing && selectedResult) {
      await updateExamResult(selectedResult.id, data);
    } else {
      await createExamResult(data);
    }
    setDialogOpen(false);
    setIsEditing(false);
    setSelectedResult(null);
    form.reset();
  };

  const handleEdit = (result: ExamResult) => {
    setSelectedResult(result);
    setIsEditing(true);
    form.reset({
      studentProfileId: result.studentProfileId,
      registrationNumber: result.registrationNumber,
      studentName: result.studentName,
      academicYear: result.academicYear,
      semester: result.semester,
      courseOfferingId: result.courseOfferingId,
      courseCode: result.courseCode,
      courseName: result.courseName,
      credits: result.credits,
      cat1Score: result.cat1Score,
      cat2Score: result.cat2Score,
      assignmentScore: result.assignmentScore,
      finalExamScore: result.finalExamScore,
      instructorId: result.instructorId,
      instructorName: result.instructorName,
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (selectedResult) {
      await deleteExamResult(selectedResult.id);
      setDeleteDialogOpen(false);
      setSelectedResult(null);
      loadData();
    }
  };

  const handleSubmitResult = async (id: string) => {
    await submitExamResult(id);
    loadData();
  };

  const handleCourseChange = (courseId: string) => {
    const course = courseOfferings.find(c => c.id === courseId);
    if (course) {
      form.setValue('courseCode', course.code);
      form.setValue('courseName', course.name);
      form.setValue('credits', course.credits);
    }
  };

  const handleStudentChange = (studentId: string) => {
    const student = studentProfiles.find(s => s.id === studentId);
    if (student) {
      form.setValue('registrationNumber', student.registrationNumber);
      form.setValue('studentName', `${student.firstName} ${student.lastName}`);
    }
  };

  const handleBulkUpload = async () => {
    setIsUploading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsUploading(false);
    setUploadDialogOpen(false);
    loadData();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: 'secondary',
      submitted: 'default',
      approved: 'default',
      rejected: 'destructive',
    };

    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    );
  };

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      'A': 'bg-green-100 text-green-800',
      'A-': 'bg-green-100 text-green-800',
      'B+': 'bg-blue-100 text-blue-800',
      'B': 'bg-blue-100 text-blue-800',
      'B-': 'bg-blue-100 text-blue-800',
      'C+': 'bg-yellow-100 text-yellow-800',
      'C': 'bg-yellow-100 text-yellow-800',
      'C-': 'bg-yellow-100 text-yellow-800',
      'D+': 'bg-orange-100 text-orange-800',
      'D': 'bg-orange-100 text-orange-800',
      'F': 'bg-red-100 text-red-800',
    };
    return colors[grade] || 'bg-gray-100 text-gray-800';
  };

  if (!mounted) return null;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Exam Results Management</h1>
          <p className="text-muted-foreground">Manage student exam results</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{examResults.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {examResults.filter(r => r.status === 'draft').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {examResults.filter(r => r.status === 'submitted').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {examResults.filter(r => r.status === 'approved').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by student name, registration number, or course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courseOfferings.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Reg. Number</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Total Score</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResults.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No results found
                  </TableCell>
                </TableRow>
              ) : (
                filteredResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">{result.studentName}</TableCell>
                    <TableCell>{result.registrationNumber}</TableCell>
                    <TableCell>
                      {result.courseCode} - {result.courseName}
                    </TableCell>
                    <TableCell>{result.academicYear}</TableCell>
                    <TableCell className="capitalize">{result.semester}</TableCell>
                    <TableCell className="font-semibold">{result.totalScore}</TableCell>
                    <TableCell>
                      <Badge className={getGradeColor(result.grade)}>
                        {result.grade}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(result.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/instructor/results/${result.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {result.status === 'draft' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(result)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSubmitResult(result.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedResult(result);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Result' : 'Add New Result'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update the exam result details' : 'Enter exam result details for a student'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="studentProfileId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select onValueChange={(value) => { field.onChange(value); handleStudentChange(value); }} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {studentProfiles.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.registrationNumber} - {student.programName}
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="courseOfferingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select onValueChange={(value) => { field.onChange(value); handleCourseChange(value); }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courseOfferings.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.code} - {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="academicYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
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
                <Button type="submit" disabled={loading}>
                  {isEditing ? 'Update Result' : 'Add Result'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        {/* ... (keep existing content) ... */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Result</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this result? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog removed */}
    </div>
  );
}
