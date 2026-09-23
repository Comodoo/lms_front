'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useResults } from '@/lib/results-context';
import { ArrowLeft, Edit, Save, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { ExamResult } from '@/lib/college-types';

const editSchema = z.object({
  cat1Score: z.number().min(0).max(100).optional(),
  cat2Score: z.number().min(0).max(100).optional(),
  assignmentScore: z.number().min(0).max(100).optional(),
  finalExamScore: z.number().min(0).max(100),
  remarks: z.string().optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

export default function ResultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getExamResultById, updateExamResult, deleteExamResult, submitExamResult, calculateGrade, loading } = useResults();
  
  const [result, setResult] = useState<ExamResult | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
  });

  useEffect(() => {
    loadResult();
  }, [params.id]);

  const loadResult = async () => {
    const data = await getExamResultById(params.id as string);
    if (data) {
      setResult(data);
      form.reset({
        cat1Score: data.cat1Score,
        cat2Score: data.cat2Score,
        assignmentScore: data.assignmentScore,
        finalExamScore: data.finalExamScore,
        remarks: data.remarks,
      });
    }
  };

  const onSubmit = async (data: EditFormValues) => {
    const totalScore = (data.cat1Score || 0) + (data.cat2Score || 0) + (data.assignmentScore || 0) + data.finalExamScore;
    const { grade, points } = calculateGrade(totalScore);
    
    await updateExamResult(params.id as string, {
      ...data,
      totalScore,
      grade,
      gradePoints: points,
    });
    
    await loadResult();
    setIsEditing(false);
  };

  const handleSubmitResult = async () => {
    try {
      await submitExamResult(params.id as string);
      await loadResult();
      toast.success(result?.status === 'rejected' ? 'Result resubmitted for approval' : 'Result submitted for approval');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit result');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteExamResult(params.id as string);
      toast.success('Result deleted');
      router.push('/instructor/results');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete result');
    }
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: 'secondary',
      submitted: 'default',
      published: 'default',
      rejected: 'destructive',
    };

    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    );
  };

  if (!result) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Result Not Found</h2>
          <Button onClick={() => router.push('/instructor/results')}>
            Back to Results
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={form.handleSubmit(onSubmit)} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Badge variant={result.status === 'submitted' ? 'default' : result.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">
                  {result.status}
                </Badge>
                {(result.status === 'draft' || result.status === 'rejected') && (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
                {(result.status === 'draft' || result.status === 'rejected') && (
                  <Button onClick={handleSubmitResult}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {result.status === 'rejected' ? 'Resubmit' : 'Submit'}
                  </Button>
                )}
                {result.status === 'submitted' && (
                  <Button variant="outline" disabled>
                    <Clock className="w-4 h-4 mr-2" />
                    Pending Review
                  </Button>
                )}
                {(result.status === 'draft' || result.status === 'rejected') && (
                  <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Information */}
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Student Name</p>
                  <p className="font-medium">{result.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Registration Number</p>
                  <p className="font-medium">{result.registrationNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Information */}
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Course Code</p>
                  <p className="font-medium">{result.courseCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Course Name</p>
                  <p className="font-medium">{result.courseName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Credits</p>
                  <p className="font-medium">{result.credits}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Instructor</p>
                  <p className="font-medium">{result.instructorName}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scores */}
          <Card>
            <CardHeader>
              <CardTitle>Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Form {...form}>
                  <form className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cat1Score"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CAT 1</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" max="100" {...field} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
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
                          <FormLabel>CAT 2</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" max="100" {...field} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
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
                          <FormLabel>Assignment</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" max="100" {...field} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
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
                          <FormLabel>Final Exam</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" max="100" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">CAT 1</p>
                    <p className="font-medium text-2xl">{result.cat1Score || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CAT 2</p>
                    <p className="font-medium text-2xl">{result.cat2Score || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Assignment</p>
                    <p className="font-medium text-2xl">{result.assignmentScore || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Final Exam</p>
                    <p className="font-medium text-2xl">{result.finalExamScore}</p>
                  </div>
                  <div className="col-span-2 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Total Score</p>
                      <p className="font-bold text-3xl">{result.totalScore}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Remarks */}
          {isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle>Remarks</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea placeholder="Add remarks about this result..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Form>
              </CardContent>
            </Card>
          ) : (
            result.remarks && (
              <Card>
                <CardHeader>
                  <CardTitle>Remarks</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{result.remarks}</p>
                </CardContent>
              </Card>
            )
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Result Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {getStatusBadge(result.status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Grade</span>
                <Badge className={getGradeColor(result.grade)}>{result.grade}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Grade Points</span>
                <span className="font-medium">{result.gradePoints.toFixed(1)}</span>
              </div>
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Submitted</span>
                  <span className="text-sm">{result.submittedAt ? new Date(result.submittedAt).toLocaleString() : '—'}</span>
                </div>
                {result.publishedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Published</span>
                    <span className="text-sm">{new Date(result.publishedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
              {result.status === 'rejected' && result.rejectionReason && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Rejection Reason</p>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {result.rejectionReason}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Academic Period */}
          <Card>
            <CardHeader>
              <CardTitle>Academic Period</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Academic Year</span>
                <span className="font-medium">{result.academicYear}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Semester</span>
                <span className="font-medium capitalize">{result.semester}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
    </div>
  );
}
