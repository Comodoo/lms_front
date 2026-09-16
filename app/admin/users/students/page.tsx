'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useResults } from '@/lib/results-context';
import { Search, Filter, MoreVertical, Edit, Trash2, UserPlus, Eye, CheckCircle, XCircle, Key } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { resetStudentPassword } from '@/lib/api-client';
import { useToast } from '@/components/ui/use-toast';
import Swal from 'sweetalert2';

export default function AdminStudentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { studentProfiles, deleteStudentProfile, loading, examResults } = useResults();
  const [mounted, setMounted] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [programFilter, setProgramFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Calculate CGPA for each student based on exam results
    const enrichedData = studentProfiles.map(student => {
      const studentResults = examResults.filter(r => 
        String(r.studentProfileId) === String(student.id) || 
        String(r.registrationNumber) === String(student.registrationNumber)
      );

      let totalPoints = 0;

      studentResults.forEach(r => {
        const gpaPoints = Number(r.gradePoints) || 0;
        totalPoints += gpaPoints;
      });

      return {
        ...student,
        cgpa: studentResults.length > 0 ? (totalPoints / studentResults.length) : 0
      };
    });
    
    setStudents(enrichedData);
  }, [studentProfiles, examResults]);

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      await deleteStudentProfile(id);
      Swal.fire(
        'Deleted!',
        'Student profile has been deleted.',
        'success'
      );
    }
  };

  const handleResetPassword = async (userId: string, lastName: string) => {
    const newPassword = lastName.toLowerCase();
    
    const result = await Swal.fire({
      title: 'Reset Password?',
      text: `Are you sure you want to reset the password for this student? The new password will be "${newPassword}".`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, reset it!'
    });

    if (result.isConfirmed) {
      try {
        await resetStudentPassword(userId);
        Swal.fire(
          'Reset!',
          'Student password has been reset successfully.',
          'success'
        );
      } catch (error) {
        Swal.fire(
          'Error!',
          'An error occurred while resetting the password.',
          'error'
        );
      }
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.programName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
                          
    const matchesDepartment = departmentFilter === 'All' || s.department === departmentFilter;
    const matchesProgram = programFilter === 'All' || s.programName === programFilter;
    const matchesYear = yearFilter === 'All' || `Year ${s.currentYear}` === yearFilter;
    
    return matchesSearch && matchesDepartment && matchesProgram && matchesYear;
  });

  // Extract unique values for filters
  const departments = ['All', ...Array.from(new Set(students.map(s => s.department).filter(Boolean)))];
  const programs = ['All', ...Array.from(new Set(students.map(s => s.programName).filter(Boolean)))];
  const years = ['All', ...Array.from(new Set(students.map(s => `Year ${s.currentYear}`)))];

  if (!mounted) return null;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Student Management</h1>
          <p className="text-muted-foreground">View and manage all enrolled students</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by reg number, name or program..."
                value={searchTerm || ''}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <select 
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                {departments.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
              </select>

              <select 
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background max-w-[200px] truncate"
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
              >
                {programs.map(p => <option key={p} value={p}>{p === 'All' ? 'All Courses' : p}</option>)}
              </select>

              <select 
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                {years.map(y => <option key={y} value={y}>{y === 'All' ? 'All Years' : y}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reg. Number</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Intake</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.registrationNumber}</TableCell>
                    <TableCell>{student.firstName} {student.lastName}</TableCell>
                    <TableCell>{student.department}</TableCell>
                    <TableCell>{student.programName}</TableCell>
                    <TableCell>Year {student.currentYear}</TableCell>
                    <TableCell>{student.intake}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {student.status === 'active' ? (
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-red-500" />
                        )}
                        <span className="capitalize text-sm">{student.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => router.push(`/admin/users/students/${student.id}`)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/admin/users/edit/${student.id}`)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Student
                          </DropdownMenuItem>
                          
                          {(student.userId || student.user_id) && (
                            <DropdownMenuItem onClick={() => handleResetPassword(student.userId || student.user_id, student.lastName)}>
                              <Key className="w-4 h-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(student.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
