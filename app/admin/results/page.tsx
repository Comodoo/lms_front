'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useResults } from '@/lib/results-context';
import { Search, Filter, TrendingUp, AlertTriangle, CheckCircle, XCircle, Eye, Download, Edit } from 'lucide-react';

export default function AdminResultsPage() {
  const router = useRouter();
  const { studentProfiles: rawProfiles, examResults: rawResults, loading, updateStudentProfile } = useResults();
  
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [academicYearFilter, setAcademicYearFilter] = useState<string>('2024/2025');

  const [editingRemarkId, setEditingRemarkId] = useState<string | null>(null);
  const [editingRemarkValue, setEditingRemarkValue] = useState<string>('');

  const handleSaveRemark = async (studentId: string) => {
    await updateStudentProfile(studentId, { remark: editingRemarkValue });
    setEditingRemarkId(null);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Dynamically enrich students with their results from context
  const enrichedStudents = rawProfiles.map(student => {
    const studentResults = rawResults.filter(r => String(r.studentProfileId) === String(student.id));
    
    let totalCredits = 0;
    let totalPoints = 0;

    studentResults.forEach(r => {
      const credit = Number(r.credits) || 0;
      const gpaPoints = Number(r.gradePoints) || 0;
      totalCredits += credit;
      totalPoints += (gpaPoints * credit);
    });

    const cgpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0;
    
    return {
      ...student,
      cgpa: cgpa,
      totalCreditsEarned: totalCredits,
      studentResults: studentResults,
      status: student.status === 'graduated' ? 'graduated' : (cgpa < 2.0 && totalCredits > 0 ? 'probation' : student.status)
    };
  });

  const filteredStudents = enrichedStudents.filter(s => {
    if (searchTerm && 
        !s.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !(s.studentName && s.studentName.toLowerCase().includes(searchTerm.toLowerCase())) &&
        !s.programName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (programFilter !== 'all' && s.programId !== programFilter) {
      return false;
    }
    if (statusFilter === 'continue' && s.cgpa < 2.0) return false;
    if (statusFilter === 'discontinue' && s.cgpa >= 2.0) return false;
    
    // Academic Year filtering logic could be added here if needed
    return true;
  });

  const getContinuationStatus = (cgpa: number, status: string, remark?: string) => {
    if (remark?.toUpperCase() === 'PASS') {
      return { label: 'Good Standing', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    }
    if (remark?.toUpperCase() === 'FAIL') {
      return { label: 'Discontinued', color: 'bg-red-100 text-red-800', icon: XCircle };
    }

    if (status === 'graduated') {
      return { label: 'Graduated', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    }
    if (cgpa < 2.0 || status === 'withdrawn' || status === 'suspended') {
      return { label: 'Discontinued', color: 'bg-red-100 text-red-800', icon: XCircle };
    }
    return { label: 'Good Standing', color: 'bg-green-100 text-green-800', icon: CheckCircle };
  };

  const getStudentLatestGPA = (studentProfileId: string) => {
    const student = enrichedStudents.find(s => String(s.id) === String(studentProfileId));
    if (!student || !student.studentResults || student.studentResults.length === 0) return 0;

    const semStats: Record<string, { points: number, credits: number }> = {};
    
    student.studentResults.forEach((r: any) => {
      // Group by academic year and semester to isolate the latest one
      const semKey = `${r.academicYear} - ${r.semester}`;
      if (!semStats[semKey]) {
        semStats[semKey] = { points: 0, credits: 0 };
      }
      semStats[semKey].points += (Number(r.gradePoints) * Number(r.credits));
      semStats[semKey].credits += Number(r.credits);
    });

    // Sort to find the latest semester
    const sortedSemKeys = Object.keys(semStats).sort();
    const latestSemKey = sortedSemKeys[sortedSemKeys.length - 1];
    
    const stats = semStats[latestSemKey];
    return stats.credits > 0 ? (stats.points / stats.credits) : 0;
  };

  const stats = {
    total: enrichedStudents.length,
    goodStanding: enrichedStudents.filter(s => s.cgpa >= 2.0 && s.status !== 'graduated' && s.status !== 'withdrawn' && s.status !== 'suspended').length,
    probation: enrichedStudents.filter(s => s.status === 'probation').length,
    discontinued: enrichedStudents.filter(s => s.status === 'withdrawn' || s.status === 'suspended' || s.cgpa < 2.0).length,
    graduated: enrichedStudents.filter(s => s.status === 'graduated').length,
    averageCGPA: enrichedStudents.length > 0 
      ? enrichedStudents.reduce((sum, s) => sum + (s.cgpa || 0), 0) / enrichedStudents.length 
      : 0,
  };

  if (!mounted) return null;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Student Academic Performance</h1>
          <p className="text-muted-foreground">Monitor student results, GPA, and continuation status</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
            Back to Dashboard
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Good Standing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.goodStanding}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              Probation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.probation}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              Discontinued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.discontinued}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Avg CGPA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.averageCGPA.toFixed(2)}</div>
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
                placeholder="Search by name, reg number, or program..."
                value={searchTerm || ''}
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
                  <SelectItem value="continue">Good Standing</SelectItem>
                  <SelectItem value="discontinue">Discontinued</SelectItem>
                </SelectContent>
              </Select>
              <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025/2026">2025/2026</SelectItem>
                  <SelectItem value="2024/2025">2024/2025</SelectItem>
                  <SelectItem value="2023/2024">2023/2024</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Academic Performance</CardTitle>
          <CardDescription>
            Track CGPA, credit accumulation, and continuation status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reg. Number</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Current Year</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>CGPA</TableHead>
                <TableHead>GPA</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Continuation</TableHead>
                <TableHead>Remark</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => {
                  const continuationStatus = getContinuationStatus(student.cgpa || 0, student.status, student.remark);
                  const StatusIcon = continuationStatus.icon;
                  const latestGPA = getStudentLatestGPA(student.id);
                  
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.registrationNumber}</TableCell>
                      <TableCell className="capitalize">{student.studentName}</TableCell>
                      <TableCell>{student.programName}</TableCell>
                      <TableCell>Year {student.currentYear}</TableCell>
                      <TableCell className="capitalize">{student.currentSemester}</TableCell>
                      <TableCell>
                        <span className={`font-bold ${student.cgpa >= 2.0 ? 'text-green-600' : 'text-red-600'}`}>
                          {student.cgpa?.toFixed(2) || '0.00'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-gray-700">{latestGPA.toFixed(2)}</span>
                      </TableCell>
                      <TableCell>{student.totalCreditsEarned}</TableCell>
                      <TableCell>
                        <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={continuationStatus.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {continuationStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {editingRemarkId === student.id ? (
                          <div className="flex items-center gap-1">
                            <Input 
                              value={editingRemarkValue} 
                              onChange={(e) => setEditingRemarkValue(e.target.value)} 
                              className="h-7 w-[100px] text-xs px-2"
                              autoFocus
                            />
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSaveRemark(student.id)}>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingRemarkId(null)}>
                              <XCircle className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between group min-w-[80px]">
                            <span className={`font-semibold ${student.remark ? 'text-blue-600' : (student.cgpa >= 2.0 ? 'text-green-600' : (student.cgpa > 0 ? 'text-red-600' : 'text-gray-400'))}`}>
                              {student.remark || (student.cgpa >= 2.0 ? 'PASS' : (student.cgpa > 0 ? 'FAIL' : 'N/A'))}
                            </span>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0" 
                              onClick={() => {
                                setEditingRemarkId(student.id);
                                setEditingRemarkValue(student.remark || (student.cgpa >= 2.0 ? 'PASS' : (student.cgpa > 0 ? 'FAIL' : 'N/A')));
                              }}
                            >
                              <Edit className="w-3 h-3 text-muted-foreground" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/results/${student.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Continuation Policy Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Continuation Policy</CardTitle>
          <CardDescription>Academic requirements for student continuation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">Good Standing</h4>
              <p className="text-sm text-green-800">CGPA of 2.0 or higher. Student can continue studies normally.</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-900 mb-2">Discontinuation</h4>
              <p className="text-sm text-red-800">CGPA lower than 2.0. Student is discontinued from the program.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
