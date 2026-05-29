'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { coursesApi, creditsApi, departmentsApi, programsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
    BookOpen,
    Building2,
    Edit,
    GraduationCap,
    Loader2,
    MoreHorizontal,
    Plus,
    Search,
    Trash2,
    Users,
    XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

// Ensure SweetAlert2 is always on top of Radix Dialogs
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .swal2-container {
      z-index: 99999 !important;
      pointer-events: auto !important;
    }
    body[style*="pointer-events: none"] .swal2-container {
      pointer-events: auto !important;
    }
  `;
  document.head.appendChild(style);
}

interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  credit_id?: string;
  instructor_id?: string;
  credit_name?: string;
  credit_value?: number;
  department_id?: string;
  department_name?: string;
  program_id?: string;
  program_name?: string;
  status: 'active' | 'inactive';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

interface Department {
  id: string;
  code: string;
  name: string;
  head_of_department?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Program {
  id: string;
  code: string;
  name: string;
  department_id: string;
}

interface Credit {
  id: string;
  code: string;
  name: string;
  value: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Instructor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export default function AdminCoursesPage() {
  const [activeTab, setActiveTab] = useState('courses');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isDeptCreateDialogOpen, setIsDeptCreateDialogOpen] = useState(false);
  const [isDeptEditDialogOpen, setIsDeptEditDialogOpen] = useState(false);
  const [isCreditCreateDialogOpen, setIsCreditCreateDialogOpen] = useState(false);
  const [isCreditEditDialogOpen, setIsCreditEditDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [creditForm, setCreditForm] = useState({ code: '', name: '', value: 1.0, description: '', is_active: true });
  const [deptForm, setDeptForm] = useState({ code: '', name: '', head_of_department: '', description: '', is_active: true });
  const [courseForm, setCourseForm] = useState({ code: '', name: '', description: '', instructor_id: '', credit_id: '', department_id: '', program_id: '', status: 'active' });
  
  const { isAuthenticated } = useAuth();

  // Pagination state
  const [coursePage, setCoursePage] = useState(1);
  const itemsPerPage = 10;

  const filteredCourses = courses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.department_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCoursePages = Math.ceil(filteredCourses.length / itemsPerPage);
  const paginatedCourses = filteredCourses.slice(
    (coursePage - 1) * itemsPerPage,
    coursePage * itemsPerPage
  );

  // Reset to first page when search changes
  useEffect(() => {
    setCoursePage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (isAuthenticated) {
      loadCourses();
      loadDepartments();
      loadPrograms();
      loadCredits();
      loadInstructors();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadCourses = async () => {
    setLoading(true);
    setError(null);
    const response = await coursesApi.getAll();
    if (response.error) {
      setError(response.error);
    } else if (response.data && Array.isArray(response.data)) {
      const mappedCourses = response.data.map((course: any) => ({
        ...course,
        instructor_id: course.instructor_assignments?.[0]?.instructor_id || '',
        instructor_name: course.instructor_assignments?.[0]?.instructor 
          ? `${course.instructor_assignments[0].instructor.first_name} ${course.instructor_assignments[0].instructor.last_name}`
          : '',
        department_name: course.department?.name || course.department_name || 'N/A',
        program_name: course.program?.name || 'N/A'
      }));
      console.log('Courses Data:', mappedCourses);
      setCourses(mappedCourses);
    }
    setLoading(false);
  };

  const loadDepartments = async () => {
    const response = await departmentsApi.getAll();
    if (response.data && Array.isArray(response.data)) {
      setDepartments(response.data);
    }
  };

  const loadPrograms = async () => {
    const response = await programsApi.getAll();
    if (response.data && Array.isArray(response.data)) {
      setPrograms(response.data);
    }
  };

  const handleDeptCreate = async () => {
    const result = await Swal.fire({
      title: 'Create Department?',
      text: "Do you want to create this department?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Yes, create it!'
    });

    if (result.isConfirmed) {
      const response = await departmentsApi.create(deptForm);
      if (response.error) {
        Swal.fire('Error!', response.error, 'error');
      } else {
        Swal.fire('Created!', 'Department has been created.', 'success');
        setIsDeptCreateDialogOpen(false);
        setDeptForm({ code: '', name: '', head_of_department: '', description: '', is_active: true });
        loadDepartments();
      }
    }
  };

  const handleDeptUpdate = async () => {
    if (!selectedDepartment) return;
    
    const result = await Swal.fire({
      title: 'Update Department?',
      text: "Save changes to this department?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Yes, update it!'
    });

    if (result.isConfirmed) {
      const response = await departmentsApi.update(selectedDepartment.id, deptForm);
      if (response.error) {
        Swal.fire('Error!', response.error, 'error');
      } else {
        Swal.fire('Updated!', 'Department has been updated.', 'success');
        setIsDeptEditDialogOpen(false);
        setSelectedDepartment(null);
        setDeptForm({ code: '', name: '', head_of_department: '', description: '', is_active: true });
        loadDepartments();
      }
    }
  };

  const handleDeptDelete = async (deptId: string) => {
    const result = await Swal.fire({
      title: 'Delete Department?',
      text: "This may affect courses assigned to this department!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      const response = await departmentsApi.delete(deptId);
      if (response.error) {
        Swal.fire('Error!', response.error, 'error');
      } else {
        Swal.fire('Deleted!', 'Department has been deleted.', 'success');
        loadDepartments();
      }
    }
  };

  const loadCredits = async () => {
    const response = await creditsApi.getAll();
    if (response.data && Array.isArray(response.data)) {
      setCredits(response.data);
    }
  };

  const loadInstructors = async () => {
    const response = await coursesApi.getInstructors();
    if (response.data && Array.isArray(response.data)) {
      setInstructors(response.data);
    }
  };

  const handleCreditCreate = async () => {
    const result = await Swal.fire({
      title: 'Create Credit?',
      text: "Do you want to create this credit system?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Yes, create it!'
    });

    if (result.isConfirmed) {
      const response = await creditsApi.create(creditForm);
      if (response.error) {
        Swal.fire('Error!', response.error, 'error');
      } else {
        Swal.fire('Created!', 'Credit has been created.', 'success');
        setIsCreditCreateDialogOpen(false);
        setCreditForm({ code: '', name: '', value: 1.0, description: '', is_active: true });
        loadCredits();
      }
    }
  };

  const handleCreditUpdate = async () => {
    if (!selectedCredit) return;

    const result = await Swal.fire({
      title: 'Update Credit?',
      text: "Save changes to this credit?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Yes, update it!'
    });

    if (result.isConfirmed) {
      const response = await creditsApi.update(selectedCredit.id, creditForm);
      if (response.error) {
        Swal.fire('Error!', response.error, 'error');
      } else {
        Swal.fire('Updated!', 'Credit has been updated.', 'success');
        setIsCreditEditDialogOpen(false);
        setSelectedCredit(null);
        setCreditForm({ code: '', name: '', value: 1, description: '', is_active: true });
        loadCredits();
      }
    }
  };

  const handleCreditDelete = async (creditId: string) => {
    const result = await Swal.fire({
      title: 'Delete Credit?',
      text: "This may affect courses using this credit!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      const response = await creditsApi.delete(creditId);
      if (response.error) {
        Swal.fire('Error!', response.error, 'error');
      } else {
        Swal.fire('Deleted!', 'Credit has been deleted.', 'success');
        loadCredits();
      }
    }
  };

  const handleDelete = async (courseId: string) => {
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
      const response = await coursesApi.delete(courseId);
      if (response.error) {
        Swal.fire('Error!', response.error, 'error');
      } else {
        Swal.fire('Deleted!', 'The course has been deleted.', 'success');
        loadCourses();
      }
    }
  };

  const handleCourseCreate = async () => {
    const result = await Swal.fire({
      title: 'Save new course?',
      text: "Do you want to create this course?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Yes, save it!'
    });

    if (result.isConfirmed) {
      // Exclude instructor_id from creation payload
      const { instructor_id, ...payload } = courseForm;
      const response = await coursesApi.create(payload);
      if (response.error) {
        Swal.fire('Error!', response.error, 'error');
      } else {
        Swal.fire('Saved!', 'The course has been created.', 'success');
        setIsCreateDialogOpen(false);
        setCourseForm({ code: '', name: '', description: '', instructor_id: '', credit_id: '', department_id: '', status: 'active' });
        await loadCourses();
      }
    }
  };

  const handleInstructorAssign = async (instructorId: string) => {
    console.log('handleInstructorAssign called with:', instructorId);
    if (!selectedCourse) {
      console.error('No course selected!');
      return;
    }
    
    const instructor = instructors.find(i => i.id === instructorId);
    console.log('Found instructor:', instructor);
    const result = await Swal.fire({
      title: 'Assign Instructor?',
      text: `Do you want to assign ${instructor?.first_name} ${instructor?.last_name} to ${selectedCourse.code}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Yes, assign!'
    });

    if (result.isConfirmed) {
      try {
        const response = await coursesApi.assignInstructor(selectedCourse.id, {
          instructor_id: instructorId,
          academic_year: '2026/2027',
          semester: 'semester_one',
          notes: 'Assigned from Admin Portal'
        });
        
        if (response.error) {
          Swal.fire('Error!', response.error, 'error');
        } else {
          Swal.fire('Assigned!', 'Instructor has been assigned.', 'success');
          loadCourses();
          
          // Instant local update for the modal UI
          if (selectedCourse) {
            const newAssignment = {
              id: response.data.assignment.id,
              instructor_id: instructorId,
              status: 'active',
              instructor: instructor
            };
            setSelectedCourse({
              ...selectedCourse,
              instructor_assignments: [...(selectedCourse.instructor_assignments || []), newAssignment]
            });
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleToggleAssignmentStatus = async (assignmentId: string, currentStatus: string) => {
    if (!selectedCourse) return;
    
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    
    const result = await Swal.fire({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Assignment?`,
      text: `This instructor assignment will be ${action}d.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: newStatus === 'active' ? '#3085d6' : '#d33',
      cancelButtonColor: '#aaa',
      confirmButtonText: `Yes, ${action}!`
    });

    if (result.isConfirmed) {
      try {
        const response = await coursesApi.updateAssignmentStatus(assignmentId, { status: newStatus });
        if (response.error) {
          Swal.fire('Error!', response.error, 'error');
        } else {
          Swal.fire(`${action.charAt(0).toUpperCase() + action.slice(1)}d!`, `Assignment has been ${action}d.`, 'success');
          loadCourses();
          
          // Instant local update for the modal UI
          if (selectedCourse) {
            setSelectedCourse({
              ...selectedCourse,
              instructor_assignments: selectedCourse.instructor_assignments?.map((a: any) => 
                a.id === assignmentId ? { ...a, status: newStatus } : a
              ) || []
            });
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleInstructorUnassign = async (assignmentId: string) => {
    if (!selectedCourse) return;
    
    const result = await Swal.fire({
      title: 'Remove Assignment?',
      text: "This instructor will be unassigned from this course.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Yes, remove!'
    });

    if (result.isConfirmed) {
      try {
        const response = await coursesApi.removeInstructor(selectedCourse.id, assignmentId);
        if (response.error) {
          Swal.fire('Error!', response.error, 'error');
        } else {
          Swal.fire('Removed!', 'Instructor assignment has been removed.', 'success');
          loadCourses();
          
          // Instant local update for the modal UI
          if (selectedCourse) {
            setSelectedCourse({
              ...selectedCourse,
              instructor_assignments: selectedCourse.instructor_assignments?.filter((a: any) => a.id !== assignmentId) || []
            });
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCourseUpdate = async () => {
    if (!selectedCourse) return;
    
    const result = await Swal.fire({
      title: 'Save changes?',
      text: "Do you want to update this course?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Yes, update it!'
    });

    if (result.isConfirmed) {
      const response = await coursesApi.update(selectedCourse.id, courseForm);
      if (response.error) {
        Swal.fire('Error!', response.error, 'error');
      } else {
        Swal.fire('Updated!', 'The course has been updated.', 'success');
        setIsEditDialogOpen(false);
        setSelectedCourse(null);
        setCourseForm({ code: '', name: '', description: '', instructor_id: '', credit_id: '', department_id: '', status: 'active' });
        loadCourses();
      }
    }
  };

  const handleCreate = async (data: any) => {
    const response = await coursesApi.create(data);
    if (response.error) {
      setError(response.error);
    } else {
      setIsCreateDialogOpen(false);
      loadCourses();
    }
  };

  const handleUpdate = async (id: string, data: any) => {
    const response = await coursesApi.update(id, data);
    if (response.error) {
      setError(response.error);
    } else {
      setIsEditDialogOpen(false);
      loadCourses();
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-muted-foreground">Please log in to access courses.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <XCircle className="h-12 w-12 text-red-500" />
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={loadCourses} variant="outline">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold">Academic Management</h1>
          <p className="text-xs text-muted-foreground">
            Manage courses, departments, and credit systems
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="courses" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="departments" className="gap-2">
            <Building2 className="h-4 w-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="credits" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Credits
          </TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Courses</h2>
              <p className="text-xs text-muted-foreground">Manage course offerings</p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Course
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Courses</p>
                    <p className="text-base font-bold">{courses.length}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Courses</p>
                    <p className="text-base font-bold text-green-600">
                      {courses.filter((c) => c.status === 'active').length}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Departments</p>
                    <p className="text-base font-bold">
                      {new Set(courses.map((c) => c.department_name)).size}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by course name, code, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Courses Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Courses ({filteredCourses.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground text-[10px] uppercase">Code</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground text-[10px] uppercase">Course Name</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground text-[10px] uppercase">Department</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground text-[10px] uppercase">Program</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground text-[10px] uppercase">Status</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground text-[10px] uppercase">Instructor</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground text-[10px] uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {paginatedCourses.map((course) => (
                      <tr key={course.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-2 px-3 font-medium">{course.code}</td>
                        <td className="py-2 px-3">
                          <div>
                            <p className="font-medium">{course.name}</p>
                            <p className="text-[10px] text-muted-foreground line-clamp-1">
                              {course.description}
                            </p>
                          </div>
                    </td>
                    <td className="py-2 px-3 text-xs">{course.department_name}</td>
                    <td className="py-2 px-3 text-xs">{course.program_name}</td>
                    <td className="py-2 px-3">{getStatusBadge(course.status)}</td>
                    <td className="py-2 px-3 text-muted-foreground">
                      {course.instructor_name || 'Unassigned'}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCourse(course);
                              setCourseForm({
                                code: course.code,
                                name: course.name,
                                description: course.description || '',
                                instructor_id: course.instructor_id || '',
                                credit_id: course.credit_id || '',
                                department_id: course.department_id || '',
                                program_id: course.program_id || '',
                                status: course.status
                              });
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit Course
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              console.log('Opening assignment dialog for course:', course);
                              setSelectedCourse(course);
                              setIsAssignDialogOpen(true);
                            }}
                          >
                            <Users className="mr-2 h-4 w-4" /> Assign Instructors
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(course.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No courses found</p>
            </div>
          )}
          
            <div className="py-4 border-t flex items-center justify-between px-4">
              <div className="text-sm text-muted-foreground">
                Showing {paginatedCourses.length > 0 ? (coursePage - 1) * itemsPerPage + 1 : 0} to {Math.min(coursePage * itemsPerPage, filteredCourses.length)} of {filteredCourses.length} entries
              </div>
              <Pagination className="justify-end mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCoursePage(p => Math.max(1, p - 1))}
                      className={coursePage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.max(1, totalCoursePages) }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink 
                        onClick={() => setCoursePage(i + 1)}
                        isActive={coursePage === i + 1}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCoursePage(p => Math.min(Math.max(1, totalCoursePages), p + 1))}
                      className={coursePage >= Math.max(1, totalCoursePages) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
        </CardContent>
      </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Departments</h2>
              <p className="text-sm text-muted-foreground">Manage academic departments</p>
            </div>
            <Button onClick={() => setIsDeptCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Department
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Departments ({departments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Code</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Head of Department</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((dept) => (
                      <tr key={dept.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{dept.code}</td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{dept.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {dept.description}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">{dept.head_of_department || 'N/A'}</td>
                        <td className="py-3 px-4">
                          {dept.is_active ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedDepartment(dept);
                                  setDeptForm({
                                    code: dept.code,
                                    name: dept.name,
                                    head_of_department: dept.head_of_department || '',
                                    description: dept.description || '',
                                    is_active: dept.is_active
                                  });
                                  setIsDeptEditDialogOpen(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" /> Edit Department
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeptDelete(dept.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {departments.length === 0 && (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No departments found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credits Tab */}
        <TabsContent value="credits" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Credit System</h2>
              <p className="text-sm text-muted-foreground">Manage credit values for courses</p>
            </div>
            <Button onClick={() => setIsCreditCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Credit
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Credits ({credits.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Code</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Value</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Description</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {credits.map((credit) => (
                      <tr key={credit.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{credit.code}</td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{credit.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {credit.description}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold">{credit.value}</td>
                        <td className="py-3 px-4 text-muted-foreground">{credit.description || 'N/A'}</td>
                        <td className="py-3 px-4">
                          {credit.is_active ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedCredit(credit);
                                  setCreditForm({
                                    code: credit.code,
                                    name: credit.name,
                                    value: credit.value,
                                    description: credit.description || '',
                                    is_active: credit.is_active
                                  });
                                  setIsCreditEditDialogOpen(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" /> Edit Credit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleCreditDelete(credit.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {credits.length === 0 && (
                <div className="text-center py-12">
                  <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No credits found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Course Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <div id="create-course-desc" className="sr-only">Form to create a new course.</div>
          </DialogHeader>
          <div className="space-y-4 py-4" aria-describedby="create-course-desc">
              <div className="space-y-2">
                <label className="text-[11px] font-medium uppercase text-muted-foreground">Course Code</label>
                <Input 
                  placeholder="e.g., CS101" 
                  value={courseForm.code}
                  onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase text-muted-foreground">Course Name</label>
              <Input 
                placeholder="e.g., Introduction to Computer Science" 
                value={courseForm.name}
                onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase text-muted-foreground">Description</label>
              <Textarea 
                placeholder="Course description..." 
                rows={2}
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                className="text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-medium uppercase text-muted-foreground">Credit</label>
                <Select value={courseForm.credit_id} onValueChange={(value) => setCourseForm({ ...courseForm, credit_id: value })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select credit" />
                  </SelectTrigger>
                  <SelectContent>
                    {credits.map((credit) => (
                      <SelectItem key={credit.id} value={credit.id} className="text-xs">
                        {credit.name} ({credit.value})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-medium uppercase text-muted-foreground">Department</label>
                <Select value={courseForm.department_id} onValueChange={(value) => setCourseForm({ ...courseForm, department_id: value, program_id: '' })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id} className="text-xs">
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase text-muted-foreground">Program</label>
              <Select disabled={!courseForm.department_id} value={courseForm.program_id} onValueChange={(value) => setCourseForm({ ...courseForm, program_id: value })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.filter(p => p.department_id === courseForm.department_id).map((prog) => (
                    <SelectItem key={prog.id} value={prog.id} className="text-xs">
                      {prog.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="p-4 pt-0">
            <Button variant="outline" size="sm" onClick={() => setIsCreateDialogOpen(false)} className="text-xs h-8">
              Cancel
            </Button>
            <Button size="sm" onClick={handleCourseCreate} className="text-xs h-8">Create Course</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <div id="edit-course-desc" className="sr-only">Form to edit an existing course.</div>
          </DialogHeader>
          <div className="space-y-4 py-4" aria-describedby="edit-course-desc">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-medium uppercase text-muted-foreground">Course Code</label>
                <Input 
                  value={courseForm.code}
                  onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-medium uppercase text-muted-foreground">Assign Instructor</label>
                <Select value={courseForm.instructor_id} onValueChange={(value) => setCourseForm({ ...courseForm, instructor_id: value })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors.map((instructor) => (
                      <SelectItem key={instructor.id} value={instructor.id} className="text-xs">
                        {instructor.first_name} {instructor.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase text-muted-foreground">Course Name</label>
              <Input 
                value={courseForm.name}
                onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase text-muted-foreground">Description</label>
              <Textarea 
                rows={2}
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                className="text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-medium uppercase text-muted-foreground">Credit</label>
                <Select value={courseForm.credit_id} onValueChange={(value) => setCourseForm({ ...courseForm, credit_id: value })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select credit" />
                  </SelectTrigger>
                  <SelectContent>
                    {credits.map((credit) => (
                      <SelectItem key={credit.id} value={credit.id} className="text-xs">
                        {credit.name} ({credit.value})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-medium uppercase text-muted-foreground">Department</label>
                <Select value={courseForm.department_id} onValueChange={(value) => setCourseForm({ ...courseForm, department_id: value, program_id: '' })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id} className="text-xs">
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase text-muted-foreground">Program</label>
              <Select disabled={!courseForm.department_id} value={courseForm.program_id} onValueChange={(value) => setCourseForm({ ...courseForm, program_id: value })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.filter(p => p.department_id === courseForm.department_id).map((prog) => (
                    <SelectItem key={prog.id} value={prog.id} className="text-xs">
                      {prog.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="p-4 pt-0">
            <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(false)} className="text-xs h-8">
              Cancel
            </Button>
            <Button size="sm" onClick={handleCourseUpdate} className="text-xs h-8">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Instructors Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-2xl" id="assign-dialog-content">
          <DialogHeader>
            <DialogTitle>Assign Instructors</DialogTitle>
            <div id="assign-instructors-desc" className="sr-only">Dialog to assign instructors to a course.</div>
          </DialogHeader>
          <div className="space-y-4 py-4" aria-describedby="assign-instructors-desc">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search instructors..." className="pl-10" />
            </div>
            <div className="space-y-3">
              {instructors.length > 0 ? (
                instructors.map((instructor) => {
                  const assignment = selectedCourse?.instructor_assignments?.find(
                    (a: any) => a.instructor_id === instructor.id
                  );
                  
                  return (
                    <div key={instructor.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-xs">{instructor.first_name} {instructor.last_name}</p>
                          <p className="text-[10px] text-muted-foreground">{instructor.email}</p>
                          {assignment && (
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={`text-[10px] h-4 ${assignment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {assignment.status}
                              </Badge>
                              <span className="text-[9px] text-muted-foreground">
                                {assignment.academic_year} • {assignment.semester?.replace('_', ' ') || ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {assignment ? (
                          <>
                            <Button 
                              size="sm" 
                              variant={assignment.status === 'active' ? 'outline' : 'default'}
                              className="h-7 text-xs px-3"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleAssignmentStatus(assignment.id, assignment.status);
                              }}
                            >
                              {assignment.status === 'active' ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              className="h-7 text-xs px-3"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInstructorUnassign(assignment.id);
                              }}
                            >
                              Remove
                            </Button>
                          </>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-xs px-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInstructorAssign(instructor.id);
                            }}
                          >
                            Assign
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  No instructors found
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="p-4 pt-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                console.log('Close button clicked');
                setIsAssignDialogOpen(false);
              }} 
              className="text-xs h-8"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Department Dialog */}
      <Dialog open={isDeptCreateDialogOpen} onOpenChange={setIsDeptCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase text-muted-foreground">Department Code</label>
              <Input 
                placeholder="e.g., CS" 
                value={deptForm.code}
                onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase text-muted-foreground">Department Name</label>
              <Input 
                placeholder="e.g., Computer Science" 
                value={deptForm.name}
                onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase text-muted-foreground">Head of Department</label>
              <Input 
                placeholder="e.g., Dr. John Smith" 
                value={deptForm.head_of_department}
                onChange={(e) => setDeptForm({ ...deptForm, head_of_department: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase text-muted-foreground">Description</label>
              <Textarea 
                placeholder="Department description..." 
                rows={2}
                value={deptForm.description}
                onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter className="p-4 pt-0">
            <Button variant="outline" size="sm" onClick={() => setIsDeptCreateDialogOpen(false)} className="text-xs h-8">
              Cancel
            </Button>
            <Button size="sm" onClick={handleDeptCreate} className="text-xs h-8">Create Department</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={isDeptEditDialogOpen} onOpenChange={setIsDeptEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase text-muted-foreground">Department Code</label>
              <Input 
                value={deptForm.code}
                onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase text-muted-foreground">Department Name</label>
              <Input 
                value={deptForm.name}
                onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase text-muted-foreground">Head of Department</label>
              <Input 
                value={deptForm.head_of_department}
                onChange={(e) => setDeptForm({ ...deptForm, head_of_department: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase text-muted-foreground">Description</label>
              <Textarea 
                rows={2}
                value={deptForm.description}
                onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter className="p-4 pt-0">
            <Button variant="outline" size="sm" onClick={() => setIsDeptEditDialogOpen(false)} className="text-xs h-8">
              Cancel
            </Button>
            <Button size="sm" onClick={handleDeptUpdate} className="text-xs h-8">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Credit Dialog */}
      <Dialog open={isCreditCreateDialogOpen} onOpenChange={setIsCreditCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Credit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase text-muted-foreground">Credit Code</label>
              <Input 
                placeholder="e.g., CR101" 
                value={creditForm.code}
                onChange={(e) => setCreditForm({ ...creditForm, code: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase text-muted-foreground">Credit Name</label>
              <Input 
                placeholder="e.g., Standard Credit" 
                value={creditForm.name}
                onChange={(e) => setCreditForm({ ...creditForm, name: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase text-muted-foreground">Credit Value</label>
              <Input 
                type="number" 
                placeholder="e.g., 3.5" 
                min="0.1"
                step="0.1"
                value={creditForm.value}
                onChange={(e) => setCreditForm({ ...creditForm, value: parseFloat(e.target.value) || 1.0 })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium uppercase text-muted-foreground">Description</label>
              <Textarea 
                placeholder="Credit description..." 
                rows={2}
                value={creditForm.description}
                onChange={(e) => setCreditForm({ ...creditForm, description: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter className="p-4 pt-0">
            <Button variant="outline" size="sm" onClick={() => setIsCreditCreateDialogOpen(false)} className="text-xs h-8">
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreditCreate} className="text-xs h-8">Create Credit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Credit Dialog */}
      <Dialog open={isCreditEditDialogOpen} onOpenChange={setIsCreditEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Credit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Credit Code</label>
              <Input 
                value={creditForm.code}
                onChange={(e) => setCreditForm({ ...creditForm, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Credit Name</label>
              <Input 
                value={creditForm.name}
                onChange={(e) => setCreditForm({ ...creditForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Credit Value</label>
              <Input 
                type="number" 
                min="0.1"
                step="0.1"
                value={creditForm.value}
                onChange={(e) => setCreditForm({ ...creditForm, value: parseFloat(e.target.value) || 1.0 })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                rows={3}
                value={creditForm.description}
                onChange={(e) => setCreditForm({ ...creditForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreditEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreditUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
