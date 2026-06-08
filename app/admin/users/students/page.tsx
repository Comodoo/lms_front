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
import { Search, Filter, MoreVertical, Edit, Trash2, UserPlus, Eye, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function AdminStudentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { getStudentProfiles, deleteStudentProfile, loading, examResults } = useResults();
  const [mounted, setMounted] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const loadData = async () => {
    const data = await getStudentProfiles();
    
    // Calculate CGPA for each student based on exam results
    const enrichedData = data.map(student => {
      const studentResults = examResults.filter(r => 
        String(r.studentProfileId) === String(student.id) || 
        String(r.registrationNumber) === String(student.registrationNumber)
      );

      let totalCredits = 0;
      let totalPoints = 0;

      studentResults.forEach(r => {
        const credit = Number(r.credits) || 0;
        const gpaPoints = Number(r.gradePoints) || 0;
        totalCredits += credit;
        totalPoints += (gpaPoints * credit);
      });

      return {
        ...student,
        cgpa: totalCredits > 0 ? (totalPoints / totalCredits) : 0
      };
    });
    
    setStudents(enrichedData);
  };

  // Re-calculate when examResults change
  useEffect(() => {
    if (students.length > 0) {
      loadData();
    }
  }, [examResults]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this student?")) {
      await deleteStudentProfile(id);
      await loadData();
    }
  };

  const filteredStudents = students.filter(s => 
    s.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.programName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by registration number, name or program..."
                value={searchTerm || ''}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
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
                <TableHead>Program</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Intake</TableHead>
                <TableHead>GPA</TableHead>
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
                    <TableCell>{student.programName}</TableCell>
                    <TableCell>Year {student.currentYear}</TableCell>
                    <TableCell>{student.intake}</TableCell>
                    <TableCell>
                      <Badge variant={student.cgpa >= 2.0 ? 'secondary' : 'destructive'} className="font-mono">
                        {student.cgpa?.toFixed(2) || '0.00'}
                      </Badge>
                    </TableCell>
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
                          <DropdownMenuSeparator />
                          {user?.role === 'admin' && (
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(student.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
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
